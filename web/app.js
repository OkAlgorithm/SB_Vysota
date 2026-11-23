import { L, levels, badges, speakers, adilet, allQuestions, courseGoals } from './course.js';
import { words, fieldGuide, aftermath } from './words.js';
import { icon, prop, schematic } from './illustrations.js';
import { lectureChapters } from './lectures.js';
import { lecturePosition, mayAdvance, readerChoice, renderLectureObject, renderLectures } from './lecture-view.js';
import { lectureObjects } from './lecture-objects.js';
import {
  PERSIST_KEY, readState, dayKey, streakDays, available, currentLevel, retryState,
  practiceBank, begin, questionAt, canSubmit, placeItem, submit, acknowledge, countDown, restartCourse
} from './engine.js';

const root = document.querySelector('#app');
const storage = (() => {
  try { return localStorage.getItem(PERSIST_KEY); }
  catch { return null; }
})();
const state = readState(storage);
let tab = window.location.hash === '#lectures' ? 'lectures' : 'route';
let lecture = null;
let lectureObject = null;
let activeId = null;
let briefId = null;
let dragging = false;
let startX = null;
let audioContext;
let stored = true;
const art = { tau: 'tau', erlan: 'erlan', damir: 'damir', nurlan: 'nurlan' };
const t = pair => pair[state.lang === 'kk' ? 1 : 0];
const w = key => t(words[key]);
const s = (ru, kk) => t(L(ru, kk));
const trTime = stamp => new Intl.DateTimeFormat(state.lang === 'kk' ? 'kk-KZ' : 'ru-KZ', {
  dateStyle: 'medium', timeStyle: 'short'
}).format(stamp);
const levelFor = id => levels.find(level => level.id === id) ?? {
  id, type: 'practice', color: id === 'daily' ? 'gold' : 'violet', image: 'tau',
  short: words.practice, title: id === 'daily' ? words.dailyTitle : words.drill,
  play: id === 'daily' ? words.dailyButton : words.goReview,
  description: id === 'daily' ? words.dailyText : words.drillText,
  bank: practiceBank(state, id)
};
const safe = value => String(value ?? '').replace(/[&<>"']/g, part => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[part]));
const img = (name, cls = '', title = '') => `<img class="${cls}" src="./art/${art[name]}.webp" alt="${safe(title)}" width="440" height="440" draggable="false">`;
const button = (label, action, options = {}) => `<button type="button" class="${options.cls || 'btn primary'}" data-act="${action}"${options.id ? ` data-id="${options.id}"` : ''}${options.disabled ? ' disabled' : ''}>${options.before ? icon(options.before, 19) : ''}<span>${safe(label)}</span>${options.after ? icon(options.after, 19) : ''}</button>`;
const ruleLink = ref => `<a class="rule-link" href="${t(adilet)}" target="_blank" rel="noopener noreferrer">${icon('book', 16)} ${w('rulePoint')} ${safe(ref)}</a>`;
const colorIcon = (name, color, cls = '') => `<span class="tile ${color} ${cls}">${icon(name, 25)}</span>`;
const numbered = n => String(n).padStart(2, '0');
const today = () => state.rewarded.includes('daily-' + dayKey());
const topic = () => activeId && state.runs[activeId];
const shields = run => run.mode === 'lesson' && !['permit','site'].includes(run.levelId);

function persist() {
  try { localStorage.setItem(PERSIST_KEY, JSON.stringify(state)); stored = true; }
  catch { stored = false; }
}

function sound(kind) {
  if (!state.sound) return;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  try {
    audioContext ??= new Context();
    audioContext.resume().catch(() => {});
    const notes = kind === 'correct' ? [523.25, 659.25, 783.99] : kind === 'miss' ? [329.63, 277.18] : [440];
    notes.forEach((pitch, index) => {
      const start = audioContext.currentTime + index * .095;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.value = pitch;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.14, start + .018);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .2);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(start);
      osc.stop(start + .22);
    });
  } catch {
    // The browser can disable audio output.
  }
}

function tabs() {
  const links = [['route', 'route'],['practice','bolt'],['awards','trophy'],['guide','book'],['lectures','film']];
  return `<nav class="tabs" aria-label="${s('Разделы курса','Курс бөлімдері')}">${links.map(([id, name]) => `<button type="button" data-act="tab" data-id="${id}" class="tab${id === tab ? ' tab-on' : ''}" aria-label="${w(id)}" title="${w(id)}"${id === tab ? ' aria-current="page"' : ''}>${icon(name, 23)}<span>${w(id)}</span>${id === 'practice' && Object.keys(state.mistakes).length ? '<i class="notice"></i>' : ''}</button>`).join('')}</nav>`;
}

function languages() {
  return `<div class="language" role="group" aria-label="${w('lang')}"><button type="button" data-act="lang" data-id="ru" lang="ru" aria-label="Русский" aria-pressed="${state.lang === 'ru'}">РУС</button><button type="button" data-act="lang" data-id="kk" lang="kk" aria-label="Қазақша" aria-pressed="${state.lang === 'kk'}">ҚАЗ</button></div>`;
}

function rail() {
  return `<aside class="sidebar">
    <button type="button" class="brand" data-act="tab" data-id="route">
      <img src="./art/brand.svg" alt="" width="48" height="48">
      <span><strong>${w('brand')}</strong><small>${w('brandSmall')}</small></span>
    </button>
    ${tabs()}
    <div class="rail-bottom">
      <p class="academy">Samruk<br><span>Business Academy</span></p>
    </div>
  </aside>`;
}

function hud() {
  const streak = streakDays(state.activity);
  return `<header class="top">
    <div class="mobile-brand"><img src="./art/brand.svg" alt="" width="35" height="35"><strong>${w('brand')}</strong></div>
    <p class="course-name">${w('course')}</p>
    <div class="top-tools">
      <span class="counter points" aria-label="${w('xp')}: ${state.xp}" title="${w('xp')}">${icon('bolt',19)} <b>${state.xp} XP</b></span>
      <span class="counter streak" aria-label="${w('streak')}: ${streak}" title="${w('streak')}">${icon('flame',19)} <b>${streak}<span class="day-label"> ${w('day')}</span></b></span>
      ${languages()}
    </div>
  </header>`;
}

function noticeCard() {
  const lessons = levels.filter(level => level.type === 'lesson');
  const done = lessons.filter(level => state.passed[level.id]).length;
  return `<aside class="dashboard-side">
    <section class="tau-card">
      <span class="sparkle s1">${icon('star',18)}</span><span class="sparkle s2">${icon('star',12)}</span>
      <div class="tau-stage">${img('tau','tau-mascot')}</div>
      <div class="tau-message">
        <h2>${w('tauHi')}</h2>
        <p>${w(state.passed.final ? 'tauDone' : state.passed.base ? 'tauNext' : 'tauNew')}</p>
      </div>
    </section>
    <section class="aside-card climb">
      <div class="aside-head">${colorIcon('mountain','violet')}<div><h2>${s('Твой подъём','Сенің өрлеуің')}</h2><span><b>${done} / 5</b> ${w('progress')}</span></div></div>
      <div class="climb-bar" role="progressbar" aria-label="${w('progress')}" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${done}">
        ${lessons.map((level,i) => `<span aria-hidden="true" class="${state.passed[level.id] ? 'reached' : ''}">${icon(state.passed[level.id] ? 'check' : level.icon, 17)}</span>`).join('')}
      </div>
    </section>
    <section class="aside-card daily">
      <div class="aside-head">${colorIcon('bolt','gold')}<div><h2>${w('dailyTitle')}</h2><span>${w(today() ? 'dailyDone' : 'dailyText')}</span></div></div>
      ${button(w('dailyButton'),'brief',{id:'daily',cls:'btn secondary small',after:'arrow'})}
    </section>
    <section class="aside-card quick-note">
      <a href="${t(adilet)}" target="_blank" rel="noopener noreferrer">${icon('book',18)}<span>${w('safetyRules')}</span>${icon('arrow',16)}</a>
      <div class="aside-line"></div><p>${w('learningOnly')}</p>
    </section>
  </aside>`;
}

function station(level, index) {
  const done = !!state.passed[level.id];
  const open = available(state, level.id);
  return `<li class="station-row${open ? '' : ' future'}">
    <div class="route-post" aria-hidden="true"><span class="${done ? 'passed-post' : open ? 'current-post' : ''}">${done ? icon('check',15) : numbered(index)}</span></div>
    <button type="button" class="station-card ${level.color}${open && !done ? ' open' : ''}" data-act="brief" data-id="${level.id}"${open ? '' : ` title="${w('coming')}"`} aria-label="${safe(t(level.title))}, ${w(done ? 'completed' : open ? 'active' : 'locked')}">
      ${colorIcon(level.icon, level.color,'station-icon')}
      <span class="station-text"><span class="station-format">${safe(t(level.short))}</span><strong>${safe(t(level.title))}</strong><span class="station-summary">${safe(t(level.description))}</span></span>
      <span class="station-end">${icon(done ? 'check' : open ? 'arrow' : 'lock', 21)}</span>
    </button>
  </li>`;
}

function routeView() {
  const next = currentLevel(state);
  const completed = Object.keys(state.passed).length;
  return `<div class="dashboard">
    <div class="route-column">
      <section class="hero">
        <img class="hero-art" src="./art/training-tower.webp" width="1280" height="720" alt="${w('sceneAlt')}" fetchpriority="high">
        <div class="hero-veil"></div>
        <div class="hero-copy">
          <span class="hero-tag">${icon('mountain',17)} ${w('heroTag')}</span>
          <h1>${w('hero1')}<br><span>${w('hero2')}</span></h1>
          <p>${w('heroText')}</p>
          ${button(w(state.passed.final ? 'doneHero' : completed || state.runs.base ? 'resume' : 'start'), 'brief', {id:next.id, cls:'btn hero-button', after:'arrow'})}
        </div>
      </section>
      <section class="track" aria-labelledby="route-heading">
        <header class="section-title"><h2 id="route-heading">${w('stations')}</h2><span class="track-count">${icon('flag',17)} ${levels.filter(l=>l.type==='lesson'&&state.passed[l.id]).length}/5</span></header>
        <ol class="station-list">${levels.map(station).join('')}</ol>
      </section>
    </div>
    ${noticeCard()}
  </div>`;
}

function subhero(title, text, label, paint = 'lavender') {
  return `<header class="subhero ${paint}"><div><span>${label}</span><h1>${title}</h1><p>${text}</p></div>${img('tau','subhero-tau')}</header>`;
}

function practiceView() {
  const mistakes = Object.keys(state.mistakes).filter(id => allQuestions.has(id)).length;
  return `<div class="secondary-view">
    ${subhero(w('practice'), s('Короткие задания для уверенных решений на смене.','Ауысымда сенімді шешім қабылдауға арналған қысқа тапсырмалар.'), w('practice'))}
    <div class="activity-grid">
      <section class="activity-card">${colorIcon('bolt','gold')}<h2>${w('dailyTitle')}</h2><p>${w(today() ? 'dailyDone' : 'dailyText')}</p>${button(w('dailyButton'),'brief',{id:'daily',after:'arrow'})}</section>
      <section class="activity-card">${colorIcon('turn','violet')}<h2>${w('drill')} ${mistakes ? `<span class="count-tag">${mistakes}</span>` : ''}</h2><p>${w(mistakes ? 'drillText' : 'noMistakes')}</p>${button(w('goReview'),'brief',{id:'review',disabled:!mistakes,after:'arrow'})}</section>
    </div>
  </div>`;
}

function awardsView() {
  return `<div class="secondary-view">
    ${subhero(w('collection'), `${state.badges.length} / ${badges.length} ${w('earnedCount')}`, w('awards'), 'pearl')}
    <div class="badge-grid">${badges.map(badge => {
      const earned = state.badges.includes(badge.id);
      return `<article class="badge-card${earned ? ' earned' : ''}">${colorIcon(badge.icon,badge.color,'badge-icon')}<h2>${safe(t(badge.title))}</h2><p>${safe(t(badge.text))}</p><span class="badge-owned">${icon(earned ? 'check' : 'lock',15)} ${w(earned ? 'earn' : 'locked')}</span></article>`;
    }).join('')}</div>
  </div>`;
}

function guideView() {
  return `<div class="secondary-view">
    ${subhero(w('guideTitle'), w('guideText'), w('guideIntro'), 'mintwash')}
    <div class="guide-grid">${fieldGuide.map(card => `<section class="guide-card">${colorIcon(card.icon,card.color)}<h2>${safe(t(card.title))}</h2><ul>${card.lines.map(line => `<li>${safe(t(line))}</li>`).join('')}</ul>${ruleLink(card.ref)}</section>`).join('')}</div>
    <p class="guide-source"><a href="${t(adilet)}" target="_blank" rel="noopener noreferrer">${w('source')} ${icon('arrow',16)}</a></p>
  </div>`;
}

function lecturesView() {
  const reader = lecture ? { chapter:lecture, practiceOpen:available(state,lecture.id) } : null;
  return renderLectures(state.lectureProgress,{t, safe, button, img},reader);
}

function openLecture(id) {
  const chapter = lectureChapters.find(item => item.id === id);
  if (!chapter) return;
  lecture = chapter;
  state.lectureProgress[id] = lecturePosition(chapter,state.lectureProgress[id]);
  persist();
  paint('#lecture-title');
  window.scrollTo(0,0);
}

function closeLectureObject() {
  const id = lectureObject;
  lectureObject = null;
  paint(`[data-act="lecture-object"][data-id="${id}"]`);
}

function turnLecturePage(action, index) {
  if (!lecture) return;
  const record = state.lectureProgress[lecture.id];
  if (action === 'lecture-choice') {
    if (!readerChoice(lecture.lines[record.index],index)) return;
    record.choices[record.index] = index;
  } else if (action === 'lecture-next' && mayAdvance(lecture,record)) {
    record.index++;
    if (record.index === lecture.lines.length) record.read = true;
  } else if (action === 'lecture-prev' && record.index > 0) {
    record.index--;
  } else if (action === 'lecture-replay') {
    record.index = 0;
    record.choices = {};
  } else {
    return;
  }
  persist();
  paint(action === 'lecture-choice' ? `[data-act="lecture-choice"][data-id="${index}"]` : '#novel-dialogue');
}

function timeLabel(deadline) {
  const secs = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  return numbered(Math.floor(secs / 60)) + ':' + numbered(secs % 60);
}

function portraitLine(question) {
  if (!question.context) return '';
  return `<div class="dialogue">
    ${img(question.speaker,'dialogue-face')}
    <div class="speech"><strong>${safe(t(speakers[question.speaker]))}</strong><p>${safe(t(question.context))}</p></div>
  </div>`;
}

function answerButtons(run, q) {
  const locked = !!run.feedback || (q.type === 'inspect' && !run.revealed);
  const names = q.type === 'admit' ? ['check','close'] : null;
  return `<div class="answer-options ${q.type === 'admit' ? 'triage-options' : q.type === 'inspect' ? 'inspection-options' : ''}">${run.questions[run.index].order.map((i, index) => {
    const selected = run.selected.includes(i);
    const classified = run.feedback && selected ? run.feedback.correct ? ' correct-answer' : ' wrong-answer' : '';
    const key = names ? icon(names[i],22) : q.type === 'inspect' ? icon(['check','close','turn'][i],22) : String(index + 1);
    return `<button type="button" class="answer${selected ? ' chosen' : ''}${classified}" data-act="pick" data-id="${i}" aria-pressed="${selected}"${locked ? ' disabled' : ''}><span class="answer-key">${key}</span><span>${safe(t(q.answers[i]))}</span>${selected && !names ? icon('check',18) : ''}</button>`;
  }).join('')}</div>`;
}

function objectInspector(run, q) {
  return `<div class="inspect-layout">
    <button type="button" class="inspect-art${run.revealed ? ' inspected' : ''}" aria-label="${w('look')}: ${safe(t(q.context))}" aria-expanded="${run.revealed}" data-act="reveal">
      ${prop(q.asset,q.id,run.revealed)}
      <span class="magnifier">${icon('search',24)}</span>
    </button>
    <div class="inspect-data">
      <h2>${safe(t(q.context))}</h2>
      ${run.revealed ? `<div class="detail-pop"><strong>${w('detail')}</strong><p>${safe(t(q.detail))}</p></div>` : `<p>${w('inspectHint')}</p>${button(w('look'),'reveal',{cls:'btn secondary small',before:'search'})}`}
    </div>
  </div>${answerButtons(run,q)}`;
}

function permitCard(run, q) {
  return `<div class="admit-card${run.feedback ? ' settled' : ''}" data-swipe>
    <span class="permit-stamp">${icon('clipboard',32)}</span>
    <div><span class="permit-label">${s('Заявка на допуск','Рұқсатқа өтінім')} ${numbered(run.index+1)}</span><p>${safe(t(q.context))}</p></div>
  </div>
  <p class="interaction-hint">${w('admitHint')}</p>
  ${answerButtons(run,q)}`;
}

function spotBoard(run,q) {
  const icons = ['tool','link','fence','radio'];
  const labels = q.answers.map((label, i) => {
    const selected = run.selected.includes(i);
    const style = run.feedback && q.correct.includes(i) ? ' correct-spot' : run.feedback && selected ? ' wrong-spot' : '';
    return `<button type="button" class="hotspot spot-${i}${selected ? ' marked' : ''}${style}" data-act="pick" data-id="${i}" aria-pressed="${selected}"${run.feedback ? ' disabled' : ''}>${icon(icons[i],19)}<span>${safe(t(label))}</span></button>`;
  });
  return `<p class="instruction">${safe(t(q.context))}</p><div class="scene-board hazard-board" role="group" aria-label="${w('diagram')}">${schematic()}<div class="scene-spots">${labels.join('')}</div></div><p class="inventory-count">${w('select')} ${run.selected.length} / ${q.correct.length}</p>`;
}

function placementBoard(run,q) {
  const label = id => q.items.find(item => item.id === id)?.label;
  const placedLabels = q.spots.map((spot, i) => {
    const fixed = run.placed[spot.id];
    const verdict = run.feedback ? fixed === spot.item ? ' correct-spot' : ' wrong-spot' : '';
    return `<button type="button" class="hotspot map-${i}${fixed ? ' filled' : ''}${verdict}" data-act="place" data-id="${spot.id}" data-drop="${spot.id}"${run.feedback ? ' disabled' : ''}>${icon(spot.icon,19)}<span><b>${safe(t(spot.label))}</b>${fixed ? `<small>${safe(t(label(fixed)))}</small>` : ''}</span></button>`;
  });
  const inventory = q.items.map(item => {
    const active = item.id === run.tool;
    const assigned = Object.values(run.placed).includes(item.id);
    return `<button type="button" class="item-card${active ? ' item-selected' : ''}${assigned ? ' item-placed' : ''}" data-act="tool" data-id="${item.id}" draggable="${!run.feedback}" aria-pressed="${active}"${run.feedback ? ' disabled' : ''}>${icon(assigned ? 'check' : item.icon,19)} <span>${safe(t(item.label))}</span></button>`;
  });
  return `<p class="instruction">${safe(t(q.context))}</p>
    <div class="scene-board placement-board${run.tool ? ' prepared' : ''}" role="group" aria-label="${w('diagram')}">${schematic()}<div class="scene-spots">${placedLabels.join('')}</div></div>
    <div class="inventory"><div class="inventory-head"><strong>${w(run.tool ? 'chooseSpot' : 'selectCard')}</strong><span>${Object.keys(run.placed).length} / ${q.spots.length} ${w('placed')}</span></div><div class="item-grid">${inventory.join('')}</div></div>`;
}

function gameFeedback(run,q) {
  const feedback = run.feedback;
  if (!feedback) return '';
  const good = feedback.correct;
  const sceneNote = !good && aftermath[q.id];
  const heading = q.type === 'map' ? w(good ? 'goodMap' : 'partialMap') : w(good ? 'right' : 'wrong');
  const mapReport = q.type === 'map' ? `<ul class="map-review">${q.spots.map(spot => `<li class="${run.placed[spot.id] === spot.item ? 'spot-ok' : 'spot-miss'}">${icon(run.placed[spot.id] === spot.item ? 'check' : 'close',15)} <span>${safe(t(spot.note))}</span></li>`).join('')}</ul>` : '';
  return `<section class="feedback ${good ? 'positive' : 'corrective'}" id="feedback" tabindex="-1" aria-labelledby="feedback-title">
    ${img('tau','feedback-tau')}
    <div class="feedback-copy"><div class="feedback-title"><h2 id="feedback-title">${heading}</h2>${feedback.delta ? `<span>+${feedback.delta} XP</span>` : ''}</div>
      ${sceneNote ? `<p class="consequence"><b>${w('unsafe')}</b> ${safe(t(sceneNote))}</p>` : ''}
      <p>${safe(t(q.note))}</p>${mapReport}
      ${ruleLink(q.ref)}
    </div>
  </section>`;
}

function gameResult(run, level) {
  const r = run.result;
  const badge = badges.find(item => item.id === run.newBadge);
  const next = levels[levels.indexOf(level) + 1];
  const pct = Math.round(r.score / r.max * 100);
  const major = run.levelId === 'final';
  const base = run.levelId === 'base';
  const practice = run.mode === 'practice';
  const title = r.passed ? (base ? 'warmupDone' : major ? 'finishWin' : practice ? 'practiceWin' : 'lessonWin') : r.endedEarly ? 'gaveUp' : 'finishFail';
  const note = r.passed ? (base ? 'warmupNote' : major ? 'passNote' : practice ? 'practiceNote' : 'stageNote') : (r.endedEarly ? 'usedLives' : 'missNote');
  const canRepeat = run.mode !== 'exam' || base;
  return `<section class="result-card${r.passed ? ' did-win' : ''}" aria-labelledby="result-title">
    <div class="result-art">${img('tau','result-tau')}${r.passed ? `<i class="confetti c1">${icon('star',32)}</i><i class="confetti c2">${icon('star',23)}</i><i class="confetti c3">${icon('bolt',27)}</i>` : ''}</div>
    <span class="result-level">${safe(t(level.title))}</span>
    <h1 id="result-title" tabindex="-1">${w(title)}</h1>
    <p>${w(note)}</p>
    ${r.timedOut ? `<p class="time-ended">${w('timedOut')}</p>` : ''}
    <div class="result-metrics">
      <div><span>${w(run.mode === 'exam' || run.levelId === 'site' ? 'scored' : 'correctCount')}</span><strong>${r.score}<small> / ${r.max}</small></strong></div>
      <div><span>${w('accuracy')}</span><strong>${pct}<small>%</small></strong></div>
      ${run.xpEarned ? `<div class="xp-result"><span>${w('totalXP')}</span><strong>+${run.xpEarned}<small> XP</small></strong></div>` : ''}
    </div>
    ${badge ? `<div class="new-award">${colorIcon(badge.icon,badge.color)}<div><small>${w('badgeNew')}</small><b>${safe(t(badge.title))}</b></div></div>` : ''}
    ${major && state.passed.base ? `<p class="comparison">${s('Разминка','Жаттығу')} <b>${state.records.base} / 10</b> <span>→</span> ${s('Итог','Қорытынды')} <b>${r.score} / 20</b></p>` : ''}
    ${major && !r.passed ? `<p class="comparison">${w('cutoff')} <b>16 / 20</b> · ${state.attempts.length}/2 ${s('попыток','әрекет')}</p>` : ''}
    <div class="result-actions">
      ${r.passed && next && !practice ? button(w('toNext'),'brief',{id:next.id,after:'arrow'}) : ''}
      ${canRepeat ? button(w(r.passed ? 'repeat' : 'retry'),'replay',{id:level.id,cls:r.passed ? 'btn secondary' : 'btn primary',before:'turn'}) : ''}
      ${Object.keys(state.mistakes).length && !r.passed ? button(w('goReview'),'tab',{id:'practice',cls:'btn secondary',after:'arrow'}) : ''}
      ${button(w('back'),'exit',{cls:'btn quiet',before:'left'})}
    </div>
  </section>`;
}

function drillView(run) {
  const level = levelFor(run.levelId);
  const q = questionAt(run);
  const current = run.index + 1;
  const panel = q?.type === 'inspect' ? objectInspector(run,q) : q?.type === 'admit' ? permitCard(run,q) : q?.type === 'map' ? placementBoard(run,q) : q?.type === 'spot' ? spotBoard(run,q) : q ? portraitLine(q)+answerButtons(run,q) : '';
  const interaction = q && !run.result ? `<div class="game-core" data-game="${q.type}">
      <div class="game-meta">${colorIcon(level.id === 'daily' ? 'bolt' : (level.icon ?? 'turn'),level.color)}<div><span>${safe(t(level.short))}</span><b>${safe(t(level.title))}</b></div></div>
      <h1 id="question" tabindex="-1">${safe(t(q.prompt))}</h1>
      ${panel}
      ${gameFeedback(run,q)}
      <div class="game-actions">
        ${run.feedback ? button(w(run.feedback.retry ? 'retry' : 'next'),'ack',{after:'arrow',cls:'btn primary confirm-answer'}) :
        button(w(run.mode === 'exam' ? (current === run.questions.length ? 'finish' : 'submit') : 'check'),'submit',{after:'arrow',disabled:!canSubmit(run),cls:'btn primary confirm-answer'})}
      </div>
    </div>` : '';
  return `<div class="game-wrap">
    <header class="game-header">
      <button type="button" class="icon-button leave" data-act="exit" aria-label="${w('exit')}" title="${w('exit')}">${icon('close',25)}</button>
      <div class="game-progress-area">
        <div class="game-progress" role="progressbar" aria-label="${w('question')}" aria-valuemin="0" aria-valuemax="${run.questions.length}" aria-valuenow="${run.result ? run.questions.length : run.index}">
          ${run.questions.map((_,i)=>`<i class="${run.result || i<run.index ? 'past' : i===run.index ? 'now' : ''}"></i>`).join('')}
        </div>
        <span>${run.result ? safe(t(level.title)) : `${w('question')} ${current} / ${run.questions.length}`}</span>
      </div>
      ${run.deadline && !run.result ? `<time id="clock" class="counter timer" aria-label="${w('finalTime')}">${timeLabel(run.deadline)}</time>` : ''}
      ${shields(run) && !run.result ? `<div class="shields" title="${w('lives')}" aria-label="${w('leftL')}: ${3-run.misses}">${[0,1,2].map(i=>`<span class="${i<3-run.misses ? 'insured' : ''}">${icon('shield',22)}</span>`).join('')}</div>` : ''}
      <button type="button" class="icon-button" data-act="sound" aria-label="${w('sound')}" title="${w('sound')}" aria-pressed="${state.sound}">${icon(state.sound ? 'sound' : 'mute',22)}</button>
    </header>
    <main class="game-main">${run.result ? gameResult(run,level) : interaction}</main>
  </div>`;
}

const skillBrief = {
  shift: [L('Наряд, напарник, проверенный комплект и подготовленная площадка нужны ещё до подъёма.','Көтерілгенге дейін наряд, серіктес, тексерілген жабдық пен дайын алаң қажет.')],
  permit: [fieldGuide[0].lines[2], fieldGuide[3].lines[0]],
  gear: [fieldGuide[1].lines[0], fieldGuide[1].lines[1]],
  site: [fieldGuide[2].lines[0], fieldGuide[2].lines[1]],
  response: [fieldGuide[3].lines[0], fieldGuide[3].lines[1]]
};

function briefDialog() {
  const level = levelFor(briefId);
  const run = state.runs[briefId];
  const final = briefId === 'final';
  const gate = final ? retryState(state) : null;
  const closed = !available(state, briefId);
  const timed = gate?.kind === 'waiting';
  const reset = gate?.kind === 'restart';
  const completed = gate?.kind === 'passed';
  const empty = level.type === 'practice' && !level.bank.length && !run;
  const currentRun = run && !run.result;
  const canOpen = !closed && !timed && !reset && !empty;
  const action = completed ? 'result' : 'play';
  const mainLabel = completed ? w('scored') : currentRun ? w('resumeGame') : safe(t(level.play));
  const extra = level.id === 'base' ? courseGoals : skillBrief[level.id];
  return `<dialog class="brief-dialog" id="brief" aria-labelledby="brief-title">
    <button class="icon-button dialog-close" type="button" data-act="cancel" aria-label="${w('close')}">${icon('close',22)}</button>
    <div class="brief-top ${level.color}">
      <div><span>${safe(t(level.short))}</span><h2 id="brief-title">${safe(t(level.title))}</h2></div>
      ${img(level.image,'brief-portrait')}
    </div>
    <div class="brief-body">
      <p>${safe(t(level.description))}</p>
      ${level.time ? `<p class="time-meta">${icon('clock',16)} ${safe(t(level.time))}</p>` : ''}
      ${extra && !closed && !currentRun ? `<div class="brief-study">${extra.map(line => `<p>${icon('check',17)} <span>${safe(t(line))}</span></p>`).join('')}</div>` : ''}
      ${final && !closed && !completed ? `<p class="condition">${w(currentRun ? 'finalPaused' : 'finalRules')}</p>` : ''}
      ${closed ? `<p class="condition">${icon('lock',16)} ${w('coming')}</p>` : ''}
      ${timed && !closed ? `<p class="condition">${icon('clock',16)} ${w('finalWaiting')} <strong>${trTime(Date.now()+gate.remaining)}</strong>.</p>` : ''}
      ${empty ? `<p class="condition">${w('noMistakes')}</p>` : ''}
      <div class="brief-actions">
        ${canOpen ? button(mainLabel,action,{id:level.id,after:'arrow'}) : ''}
        ${reset && !closed ? button(w('restartCourse'),'confirm-reset',{after:'turn'}) : ''}
        ${timed && !closed ? button(w('goReview'),'tab',{id:'practice',cls:'btn secondary',after:'arrow'}) : ''}
        ${!canOpen && !reset && !timed ? button(w('close'),'cancel',{cls:'btn secondary'}) : ''}
      </div>
    </div>
  </dialog>`;
}

function resetDialog() {
  return `<dialog class="brief-dialog" id="brief" aria-labelledby="brief-title"><div class="brief-body">
    <h2 id="brief-title">${w('restartCourse')}</h2>
    <p>${w('restartConfirm')}</p>
    <div class="brief-actions">${button(w('restartCourse'),'reset',{after:'turn'})}${button(w('cancel'),'cancel',{cls:'btn secondary'})}</div>
  </div></dialog>`;
}

function paint(focus) {
  document.documentElement.lang = state.lang;
  document.title = w('brand') + ' · ' + w('brandSmall');
  const run = topic();
  const dialogMarkup = lectureObject ? renderLectureObject(lectureObject,t,safe)
    : briefId === 'confirm-reset' ? resetDialog() : briefId ? briefDialog() : '';
  root.innerHTML = (run ? drillView(run) : `<div class="layout">${rail()}
    <main class="surface">${hud()}<div class="page">${({ route:routeView, practice:practiceView, awards:awardsView, guide:guideView, lectures:lecturesView })[tab]()}${stored ? '' : `<p class="storage-note">${w('statusUnknown')}</p>`}</div></main>
  </div>`) + dialogMarkup;
  const dialog = root.querySelector('dialog');
  if (dialog) dialog.showModal();
  else if (focus) root.querySelector(focus)?.focus({ preventScroll: true });
}

function openRoute(nextTab = 'route') {
  activeId = null;
  briefId = null;
  lecture = null;
  lectureObject = null;
  tab = nextTab;
  const url = new URL(window.location.href);
  if (nextTab === 'lectures') url.hash = 'lectures';
  else if (url.hash === '#lectures') url.hash = '';
  if (url.href !== window.location.href) history.replaceState(history.state,'',url);
  paint(`.tabs .tab[data-id="${nextTab}"]`);
  window.scrollTo(0,0);
}

function showRun(id, fresh = false) {
  const level = levelFor(id);
  if (!available(state,id) || (id === 'final' && retryState(state).kind !== 'ready')) return;
  if (!state.runs[id] || state.runs[id].result || fresh) {
    if (!level.bank.length) return;
    begin(state,level);
  }
  activeId = id;
  briefId = null;
  persist();
  paint('#question');
  window.scrollTo(0,0);
}

function focusSelector(element) {
  const id = element.dataset.id;
  const act = element.dataset.act;
  return `[data-act="${act}"]${id ? `[data-id="${id}"]` : ''}`;
}

function pick(run, id) {
  const question = questionAt(run);
  const previous = run.selected;
  if (!question?.answers[id]) return;
  if (question.type !== 'spot') run.selected = [id];
  else if (previous.includes(id)) run.selected = previous.filter(value => value !== id);
  else if (previous.length < question.correct.length) run.selected = [...previous,id];
}

root.addEventListener('click', event => {
  const ctrl = event.target.closest('button[data-act]');
  if (!ctrl || ctrl.disabled) return;
  const { act, id } = ctrl.dataset;
  if (act === 'tab') { openRoute(id); return; }
  if (act === 'exit') { openRoute(); return; }
  if (act === 'lecture-list') {
    const current = lecture?.id;
    lecture = null;
    paint(current ? `.novel-chapter[data-id="${current}"]` : '#lectures-heading');
    window.scrollTo(0,0);
    return;
  }
  if (act === 'lecture-open') { openLecture(id); return; }
  if (act === 'lecture-object' && lecture && Object.hasOwn(lectureObjects,id)) { lectureObject = id; paint(); return; }
  if (act === 'lecture-object-close') { closeLectureObject(); return; }
  if (['lecture-choice','lecture-next','lecture-prev','lecture-replay'].includes(act)) { turnLecturePage(act,Number(id)); return; }
  if (act === 'lang') {
    state.lang = id;
    persist();
    paint(focusSelector(ctrl));
    return;
  }
  if (act === 'brief') { briefId = id; paint(); return; }
  if (act === 'cancel') {
    const previous = briefId;
    briefId = null;
    paint(previous ? `[data-act="brief"][data-id="${previous}"]` : undefined);
    return;
  }
  if (act === 'play' || act === 'replay') { showRun(id, act === 'replay'); return; }
  if (act === 'result') { if (state.runs[id]) { activeId=id; briefId=null; paint('#result-title'); window.scrollTo(0,0); } return; }
  if (act === 'confirm-reset') { briefId='confirm-reset'; paint(); return; }
  if (act === 'reset') { restartCourse(state); persist(); openRoute(); return; }
  if (act === 'sound') { state.sound = !state.sound; sound('tap'); persist(); paint(focusSelector(ctrl)); return; }
  const run = topic();
  if (!run || run.result) return;
  if (act === 'ack') {
    acknowledge(state,run);
    persist();
    paint(run.result ? '#result-title' : '#question');
    window.scrollTo(0,0);
    return;
  }
  if (run.feedback) return;
  if (act === 'submit') {
    const oldXp = run.xpEarned;
    submit(state,run);
    if (run.feedback) {
      run.feedback.delta = run.xpEarned-oldXp;
      sound(run.feedback.correct ? 'correct' : 'miss');
    } else if (run.result?.passed) sound('correct');
    persist();
    paint(run.result ? '#result-title' : run.feedback ? '#feedback' : '#question');
    if (run.feedback) document.querySelector('#feedback').scrollIntoView({block:'nearest'});
    else window.scrollTo(0,0);
    return;
  }
  if (act === 'pick') pick(run, Number(id));
  if (act === 'reveal') run.revealed = true;
  if (act === 'tool') run.tool = run.tool === id ? null : id;
  if (act === 'place') {
    if (run.tool) placeItem(run,id,run.tool);
    else if (run.placed[id]) {
      run.tool = run.placed[id];
      delete run.placed[id];
    } else {
      root.querySelector('.inventory')?.scrollIntoView({block:'nearest'});
      root.querySelector('.item-card')?.focus({preventScroll:true});
      return;
    }
  }
  persist();
  paint(act === 'reveal' ? '.inspect-art' : focusSelector(ctrl));
});

root.addEventListener('cancel', event => {
  if (event.target.id === 'lecture-object-dialog') {
    event.preventDefault();
    closeLectureObject();
    return;
  }
  if (event.target.id === 'brief') {
    event.preventDefault();
    const previous = briefId;
    briefId = null;
    paint(`[data-act="brief"][data-id="${previous}"]`);
  }
}, true);

document.addEventListener('keydown', event => {
  if (!lecture || topic() || briefId || lectureObject || !['ArrowLeft','ArrowRight'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.closest?.('input, textarea, select, .tabs, .top-tools')) return;
  const record = state.lectureProgress[lecture.id];
  if (record.index >= lecture.lines.length) return;
  event.preventDefault();
  turnLecturePage(event.key === 'ArrowRight' ? 'lecture-next' : 'lecture-prev');
});

root.addEventListener('dragstart', event => {
  const card = event.target.closest('.item-card');
  if (!card || !event.dataTransfer || topic()?.feedback) return;
  dragging = true;
  event.dataTransfer.setData('text/plain', card.dataset.id);
  event.dataTransfer.effectAllowed = 'move';
  card.closest('.game-core').classList.add('dragging');
});
root.addEventListener('dragover', event => {
  if (dragging && event.target.closest('[data-drop]')) event.preventDefault();
});
root.addEventListener('drop', event => {
  const square = event.target.closest('[data-drop]');
  const run = topic();
  if (!dragging || !square || !run || run.feedback) return;
  event.preventDefault();
  placeItem(run, square.dataset.drop, event.dataTransfer.getData('text/plain'));
  dragging = false;
  persist();
  paint(`[data-drop="${square.dataset.drop}"]`);
});
root.addEventListener('dragend', () => {
  dragging = false;
  root.querySelector('.dragging')?.classList.remove('dragging');
});

root.addEventListener('pointerdown', event => {
  const card = event.target.closest('[data-swipe]:not(.settled)');
  if (!card || event.pointerType === 'mouse') return;
  startX = event.clientX;
  card.setPointerCapture(event.pointerId);
});
root.addEventListener('pointercancel', () => { startX = null; });
root.addEventListener('pointerup', event => {
  if (startX === null) return;
  const distance = event.clientX - startX;
  startX = null;
  const run = topic();
  if (!run || run.feedback || questionAt(run)?.type !== 'admit' || Math.abs(distance) < 55) return;
  pick(run,distance > 0 ? 1 : 0);
  persist();
  paint('.answer.chosen');
});

setInterval(() => {
  const running = state.runs.final;
  if (running && countDown(running,state)) {
    persist();
    if (activeId==='final' || briefId==='final') paint(activeId==='final' ? '#result-title' : undefined);
  }
  const clock = root.querySelector('#clock');
  if (clock && running) clock.textContent = timeLabel(running.deadline);
}, 500);

paint();
