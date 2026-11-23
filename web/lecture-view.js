import { L, adilet, speakers } from './course.js';
import { lectureCast, lectureChapters, lectureSettings } from './lectures.js';
import { lectureObjects } from './lecture-objects.js';
import { icon } from './illustrations.js';

const labels = {
  lectures: L('Лекции', 'Дәрістер'),
  format: L('Визуальная новелла', 'Визуалды новелла'),
  title: L('Одна смена с бригадой', 'Бригадамен бір ауысым'),
  intro: L('Пройди смену вместе с Тау, Ерланом, Дамиром и Нурланом. Читай реплики и решай, что команда сделает дальше.', 'Тау, Ерлан, Дамир және Нұрланмен бірге ауысымнан өт. Репликаларды оқып, команда әрі қарай не істейтінін шеш.'),
  chapter: L('Глава', 'Тарау'),
  chapters: L('Главы', 'Тараулар'),
  started: L('В процессе', 'Оқылып жатыр'),
  read: L('Прочитано', 'Оқылды'),
  start: L('Начать новеллу', 'Новелланы бастау'),
  resume: L('Продолжить чтение', 'Оқуды жалғастыру'),
  readAgain: L('Перечитать главу', 'Тарауды қайта оқу'),
  scene: L('Сцена', 'Көрініс'),
  previous: L('Назад', 'Артқа'),
  next: L('Дальше', 'Әрі қарай'),
  complete: L('Завершить главу', 'Тарауды аяқтау'),
  nextChapter: L('Следующая глава', 'Келесі тарау'),
  check: L('Твой выбор', 'Сенің таңдауың'),
  takeaway: L('Что запомнить', 'Нені есте сақтау керек'),
  chapterDone: L('Глава прочитана', 'Тарау оқылды'),
  allDone: L('Смена завершена', 'Ауысым аяқталды'),
  practice: L('К практике по теме', 'Тақырып бойынша жаттығуға'),
  route: L('К маршруту', 'Бағытқа оралу'),
  rules: L('Правила № 109 · п.', '№ 109 қағидалар · т.'),
  look: L('Рассмотреть', 'Үлкейтіп қарау'),
  close: L('Закрыть', 'Жабу'),
  keyboard: L('Клавиши ← → листают сцены', '← → пернелері көріністерді ауыстырады')
};

const speakerColors = { tau: 'violet', erlan: 'peach', damir: 'mint', nurlan: 'sky' };
const twoDigits = n => String(n).padStart(2, '0');
const ruleLink = (ref, t, safe) => `<a class="rule-link" href="${t(adilet)}" target="_blank" rel="noopener noreferrer">${icon('book',16)} ${t(labels.rules)} ${safe(ref)}</a>`;

function objectCard(id, t, safe, caption = false) {
  const item = lectureObjects[id];
  const title = safe(t(item.title));
  return `<button class="novel-object-card ${item.color}" type="button" data-act="lecture-object" data-id="${id}" aria-label="${t(labels.look)}: ${title}">
    <span class="novel-object-photo"><img src="./art/lecture/${id}.webp" alt="" decoding="async" draggable="false"><span class="novel-object-zoom">${icon('search',17)}</span></span>
    <span class="novel-object-label"><strong>${title}</strong>${caption ? `<span>${safe(t(item.caption))}</span>` : ''}</span>
  </button>`;
}

export function renderLectureObject(id, t, safe) {
  const item = lectureObjects[id];
  const title = safe(t(item.title));
  return `<dialog class="novel-object-dialog brief-dialog ${item.color}" id="lecture-object-dialog" aria-labelledby="lecture-object-title">
    <button type="button" class="icon-button dialog-close" data-act="lecture-object-close" aria-label="${t(labels.close)}">${icon('close',22)}</button>
    <div class="novel-object-photo"><img src="./art/lecture/${id}.webp" alt="${title}" decoding="async" draggable="false"></div>
    <div class="brief-body"><h2 id="lecture-object-title">${title}</h2><p>${safe(t(item.caption))}</p>${ruleLink(item.ref,t,safe)}</div>
  </dialog>`;
}

export function lecturePosition(chapter, saved) {
  const end = chapter.lines.length;
  const index = Number.isInteger(saved?.index) ? Math.min(end, Math.max(0, saved.index)) : 0;
  const seen = saved?.read === true;
  const choices = saved?.choices && typeof saved.choices === 'object' && !Array.isArray(saved.choices) ? saved.choices : {};
  return { index: seen || index < end ? index : 0, read: seen, choices };
}

export function readerChoice(line, choice) {
  return Number.isInteger(choice) ? line?.options?.[choice] : undefined;
}

export function mayAdvance(chapter, record) {
  const line = chapter.lines[record.index];
  return !!line && (!line.options || !!readerChoice(line, record.choices[record.index]));
}

export function renderLectures(progress, { t, safe, button, img }, reader = null) {
  const w = key => t(labels[key]);
  const rule = ref => ruleLink(ref,t,safe);
  if (!reader) {
    const finished = lectureChapters.filter(chapter => progress[chapter.id]?.read === true).length;
    const unread = lectureChapters.filter(chapter => !progress[chapter.id]?.read);
    const focus = unread.find(chapter => progress[chapter.id]?.index > 0) ?? unread[0];
    return `<div class="secondary-view novel-space">
      <header class="novel-cover">
        <div class="novel-cover-copy">
          <span class="novel-cover-kind">${icon('book',17)} ${w('format')}</span>
          <h1 id="lectures-heading" tabindex="-1">${w('title')}</h1>
          <p>${w('intro')}</p>
          ${focus ? button(w(finished || Object.keys(progress).length ? 'resume' : 'start'), 'lecture-open', {id:focus.id, cls:'btn hero-button', after:'arrow'}) : ''}
        </div>
        <div class="novel-cover-art" aria-hidden="true">${img('tau','novel-cover-tau')}${img('erlan','novel-cover-erlan')}</div>
      </header>
      <section class="novel-shelf" aria-labelledby="chapters-heading">
        <div class="section-title"><h2 id="chapters-heading">${w('chapters')}</h2><span class="track-count" aria-label="${w('read')} ${finished} / ${lectureChapters.length}">${icon('check',17)} ${finished}/${lectureChapters.length}</span></div>
        <div class="novel-chapters">${lectureChapters.map((chapter, i) => {
          const status = progress[chapter.id]?.read ? w('read') : progress[chapter.id] ? w('started') : '';
          return `<button type="button" class="novel-chapter ${chapter.color}" data-act="lecture-open" data-id="${chapter.id}">
            <span class="novel-chapter-portrait">${img(chapter.speaker)}</span>
            <span class="novel-chapter-copy"><small>${w('chapter')} ${twoDigits(i+1)}${status ? ` <i>·</i> ${status}` : ''}</small>
              <strong>${safe(t(chapter.title))}</strong><span>${safe(t(chapter.description))}</span></span>
            <span class="novel-chapter-arrow">${icon(progress[chapter.id]?.read ? 'check' : 'arrow',19)}</span>
          </button>`;
        }).join('')}</div>
      </section>
    </div>`;
  }
  const { chapter, practiceOpen } = reader;
  const chapterIndex = lectureChapters.indexOf(chapter);
  const position = lecturePosition(chapter,progress[chapter.id]);
  const setting = lectureSettings[chapter.setting];
  const line = chapter.lines[position.index];
  const selected = line ? readerChoice(line, position.choices[position.index]) : null;
  const snapshot = Math.min(position.index + 1, chapter.lines.length);
  const section = w('scene') + ' ' + snapshot + ' / ' + chapter.lines.length;
  const ref = line?.ref ?? '';
  const name = line ? t(speakers[line.speaker]) : t(speakers.tau);
  const speaker = line?.speaker ?? 'tau';
  const photo = line?.detail ? objectCard(line.detail,t,safe) : '';
  const dialogue = line ? `<div class="novel-dialogue ${speakerColors[speaker]}${photo ? ' has-object' : ''}" id="novel-dialogue" tabindex="-1" aria-label="${safe(name)}">
      <div class="novel-dialogue-copy">
      <div class="novel-line-meta"><span class="novel-voice">${safe(name)}</span>${ref ? rule(ref) : ''}</div>
      <p>${safe(t(line.text))}</p>
      ${line.options ? `<div class="novel-options">
        <h2>${w('check')}</h2>
        <div class="novel-option-grid">${line.options.map((item,index) =>
          `<button class="novel-option" type="button" data-act="lecture-choice" data-id="${index}" aria-pressed="${position.choices[position.index] === index}"><span>${index+1}</span>${safe(t(item.title))}</button>`).join('')}</div>
        ${selected ? `<div class="novel-reply" role="status"><p>${safe(t(selected.reply))}</p>${rule(selected.ref)}</div>` : ''}
      </div>` : ''}
      </div>
      ${photo}
    </div>` : `<div class="novel-dialogue novel-ending violet" id="novel-dialogue" tabindex="-1">
      <div class="novel-line-meta"><span class="novel-voice">${icon('check',18)} ${w(chapterIndex === lectureChapters.length-1 ? 'allDone' : 'chapterDone')}</span>${rule(chapter.ref)}</div>
      <h2 id="novel-takeaway-heading">${w('takeaway')}</h2><p>${safe(t(chapter.takeaway))}</p>
      <div class="novel-objects" role="group" aria-labelledby="novel-takeaway-heading">${chapter.objects.map(id => objectCard(id,t,safe,true)).join('')}</div>
    </div>`;
  const next = lectureChapters[chapterIndex + 1];
  const action = line ? button(w(position.index === chapter.lines.length-1 ? 'complete' : 'next'), 'lecture-next', {disabled:!mayAdvance(chapter,position),after:'arrow'}) :
    (next ? button(w('nextChapter'),'lecture-open',{id:next.id,after:'arrow'}) : button(w('lectures'),'lecture-list',{after:'arrow'}));
  return `<div class="secondary-view novel-space">
    <div class="novel-reader-top">
      ${button(w('chapters'),'lecture-list',{cls:'btn quiet small',before:'left'})}
      <span class="novel-reader-count">${w('chapter')} ${twoDigits(chapterIndex+1)} / ${twoDigits(lectureChapters.length)}</span>
    </div>
    <header class="novel-reader-title"><h1 id="lecture-title" tabindex="-1">${safe(t(chapter.title))}</h1><span>${line ? section : w('read')}</span></header>
    <div class="novel-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${chapter.lines.length}" aria-valuenow="${line ? snapshot : chapter.lines.length}" aria-label="${w('scene')}">${chapter.lines.map((_,i)=>`<i class="${i < position.index ? 'past' : i === position.index ? 'now' : ''}"></i>`).join('')}</div>
    <section class="novel-reader${line ? '' : ' with-takeaway'}">
      <div class="novel-scene ${chapter.setting}" aria-label="${safe(t(setting.title))}" role="group">
        <img class="novel-backdrop" src="./art/${setting.image}.webp" width="1440" height="810" alt="">
        <div class="novel-scene-light"></div>
        <span class="novel-location">${icon(chapter.icon,18)} ${safe(t(setting.title))}</span>
        <div class="novel-cast" aria-hidden="true">${lectureCast.map(actor => `<div class="novel-actor ${actor} ${speakerColors[actor]}${actor === speaker ? ' speaking' : ''}">${img(actor)}<span>${safe(t(speakers[actor]))}</span></div>`).join('')}</div>
      </div>
      ${dialogue}
      <div class="novel-controls">
        ${line ? button(w('previous'),'lecture-prev',{cls:'btn secondary',disabled:position.index === 0,before:'left'}) :
          button(w('readAgain'),'lecture-replay',{cls:'btn secondary',before:'turn'})}
        ${!line ? (practiceOpen ? button(w('practice'),'brief',{id:chapter.id,cls:'btn secondary',before:'route'}) : button(w('route'),'tab',{id:'route',cls:'btn quiet',before:'route'})) : ''}
        ${action}
      </div>
    </section>
    ${line ? `<p class="novel-keyboard">${w('keyboard')}</p>` : ''}
  </div>`;
}
