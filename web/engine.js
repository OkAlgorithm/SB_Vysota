import { allQuestions, levels } from './course.js';

export const TIMEOUT = 20 * 60 * 1000;
export const RETRY = 24 * 60 * 60 * 1000;
export const PERSIST_KEY = 'vysota-safety-journey-1';

export function newState() {
  return {
    lang: 'ru', sound: false, xp: 0, rewarded: [], badges: [],
    passed: {}, records: {}, mistakes: {}, activity: [], attempts: [], runs: {}, lectureProgress: {}
  };
}

export function readState(raw) {
  const state = newState();
  try {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return state;
    for (const [key, fallback] of Object.entries(state)) {
      const value = saved[key];
      const matches = Array.isArray(fallback) ? Array.isArray(value)
        : typeof fallback === 'object' ? value && typeof value === 'object' && !Array.isArray(value)
        : typeof value === typeof fallback;
      if (matches) state[key] = value;
    }
    for (const [id, run] of Object.entries(state.runs)) {
      if (!run || !Array.isArray(run.questions) || !Number.isInteger(run.index) ||
          (!run.result && !allQuestions.has(run.questions[run.index]?.id))) {
        delete state.runs[id];
      }
    }
  } catch {
    // Invalid or inaccessible local progress should not prevent the course opening.
  }
  return state;
}

export function dayKey(stamp = Date.now()) {
  const date = new Date(stamp);
  const fields = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  return fields.map(n => String(n).padStart(2, '0')).join('-');
}

export function streakDays(activity, stamp = Date.now()) {
  const days = new Set(activity);
  const day = new Date(stamp);
  if (!days.has(dayKey(day))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(day))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function available(state, id) {
  const index = levels.findIndex(level => level.id === id);
  return index < 1 || !!state.passed[id] || !!state.passed[levels[index - 1].id];
}

export function currentLevel(state) {
  return levels.find(level => !state.passed[level.id]) || levels.at(-1);
}

export function retryState(state, now = Date.now()) {
  if (state.passed.final) return { kind: 'passed' };
  if (state.attempts.length >= 2) return { kind: 'restart' };
  const last = state.attempts.at(-1);
  const remaining = last ? last.time + RETRY - now : 0;
  return remaining > 0 ? { kind: 'waiting', remaining } : { kind: 'ready' };
}

export function practiceBank(state, kind, random = Math.random) {
  if (kind === 'review') {
    return Object.entries(state.mistakes)
      .filter(([id]) => allQuestions.has(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => allQuestions.get(id));
  }
  const known = levels
    .filter(level => level.type === 'lesson' && state.passed[level.id])
    .flatMap(level => level.bank)
    .filter(question => question.type !== 'map');
  const bank = known.length ? known : levels[1].bank;
  return shuffle(bank, random).slice(0, 3);
}

export function begin(state, level, now = Date.now(), random = Math.random) {
  const mode = level.type === 'exam' ? 'exam' : level.type === 'practice' ? 'practice' : 'lesson';
  let ordered = mode === 'exam' || level.limit ? shuffle(level.bank, random) : level.bank;
  if (level.id === 'permit') {
    const allowed = level.bank.filter(item => item.correct === 0);
    const blocked = shuffle(level.bank.filter(item => item.correct === 1), random).slice(0, 7);
    ordered = shuffle([...allowed, ...blocked], random);
  }
  const questionSet = ordered.slice(0, level.limit || ordered.length).map(q => ({
    id: q.id,
    order: q.type === 'choice' ? shuffle(q.answers.map((_, i) => i), random) : q.answers?.map((_, i) => i) || []
  }));
  const run = {
    levelId: level.id, mode, questions: questionSet, index: 0,
    deadline: level.id === 'final' ? now + TIMEOUT : null,
    missed: [], first: [], resolved: [], misses: 0, xpEarned: 0,
    selected: [], placed: {}, revealed: false, tool: null, boardScore: null,
    feedback: null, result: null, newBadge: null
  };
  state.runs[level.id] = run;
  return run;
}

export function questionAt(run) {
  return allQuestions.get(run.questions[run.index]?.id);
}

export function canSubmit(run, question = questionAt(run)) {
  if (!question || run.feedback || run.result) return false;
  if (question.type === 'inspect' && !run.revealed) return false;
  if (question.type === 'map') return question.spots.every(spot => run.placed[spot.id]);
  return run.selected.length === (question.type === 'spot' ? question.correct.length : 1);
}

export function placeItem(run, spot, item, question = questionAt(run)) {
  if (!question?.spots?.some(s => s.id === spot) || !question.items.some(i => i.id === item)) return;
  for (const name of Object.keys(run.placed)) {
    if (run.placed[name] === item) delete run.placed[name];
  }
  run.placed[spot] = item;
  run.tool = null;
}

function markReward(state, run, id, add) {
  if (!state.rewarded.includes(id)) {
    state.rewarded.push(id);
    state.xp += add;
    run.xpEarned += add;
  }
}

function recordDay(state, now) {
  const day = dayKey(now);
  if (!state.activity.includes(day)) state.activity.push(day);
}

export function finish(state, run, now = Date.now(), endedEarly = false, timedOut = false) {
  if (run.result) return run.result;
  const level = levels.find(item => item.id === run.levelId);
  const max = run.levelId === 'site' ? 100 : run.questions.length;
  const score = run.levelId === 'site' ? run.boardScore ?? 0 : run.first.length;
  const required = run.levelId === 'site' ? 70 : level?.minimum ?? 0;
  const passed = !endedEarly && score >= required;
  if (level && passed) {
    state.passed[level.id] = true;
    if (level.id !== 'base') markReward(state, run, 'completed-' + level.id, level.id === 'final' ? 60 : 25);
    const earnsBadge = level.badge && (
      ['shift', 'final'].includes(level.id) || (level.id === 'site' ? score === 100 : run.misses === 0)
    );
    if (earnsBadge && !state.badges.includes(level.badge)) {
      state.badges.push(level.badge);
      run.newBadge = level.badge;
    }
  }
  if (run.levelId === 'final' && !state.passed.final) state.attempts.push({ time: now, score });
  if (level) state.records[level.id] = Math.max(score, state.records[level.id] ?? 0);
  if (passed && run.levelId !== 'base') recordDay(state, now);
  if (run.mode === 'practice' && run.levelId === 'daily' && run.resolved.length === max) {
    markReward(state, run, 'daily-' + dayKey(now), 10);
  }
  run.result = { score, max, required, passed, timedOut, endedEarly };
  run.feedback = null;
  return run.result;
}

export function countDown(run, state, now = Date.now()) {
  if (run.deadline && run.deadline <= now && !run.result) {
    for (const row of run.questions.slice(run.index)) state.mistakes[row.id] = now;
    finish(state, run, now, false, true);
    return true;
  }
  return false;
}

function resetAnswer(run) {
  run.selected = [];
  run.placed = {};
  run.revealed = false;
  run.tool = null;
  run.feedback = null;
}

function moveForward(state, run, now) {
  if (++run.index >= run.questions.length) finish(state, run, now);
  else resetAnswer(run);
}

export function submit(state, run, now = Date.now()) {
  if (countDown(run, state, now)) return;
  const question = questionAt(run);
  if (!canSubmit(run, question)) return;
  const picked = run.selected;
  const matched = question.type === 'map' ? question.spots.filter(spot => run.placed[spot.id] === spot.item).length : null;
  const mapScore = matched === null ? null : 100 - (question.spots.length - matched) * 15;
  const correct = mapScore === null ? (
    question.type === 'spot' ? question.correct.every(value => picked.includes(value)) : picked[0] === question.correct
  ) : mapScore === 100;

  if (question.type === 'map') run.boardScore = mapScore;
  if (correct) {
    if (!run.resolved.includes(question.id)) run.resolved.push(question.id);
    if (!run.missed.includes(question.id)) run.first.push(question.id);
    if (run.mode === 'lesson') markReward(state, run, question.id, question.type === 'map' ? 20 : 5);
    if (run.mode === 'practice' && !run.missed.includes(question.id)) delete state.mistakes[question.id];
  } else {
    run.misses++;
    if (!run.missed.includes(question.id)) run.missed.push(question.id);
    if (run.levelId !== 'base') state.mistakes[question.id] = now;
  }

  if (run.mode === 'exam') {
    moveForward(state, run, now);
    return;
  }

  const noRetry = ['permit','site'].includes(run.levelId);
  const endedEarly = run.mode === 'lesson' && !noRetry && run.misses >= 3;
  const retry = !correct && !noRetry && !endedEarly;
  run.feedback = { correct, matched, retry, endedEarly, mapScore };
}

export function acknowledge(state, run, now = Date.now()) {
  if (!run.feedback) return;
  if (run.feedback.endedEarly) finish(state, run, now, true);
  else if (run.feedback.retry) resetAnswer(run);
  else moveForward(state, run, now);
}

export function restartCourse(state) {
  const { lang, sound, xp, rewarded, badges, activity, lectureProgress } = state;
  Object.assign(state, newState(), { lang, sound, xp, rewarded, badges, activity, lectureProgress });
}
