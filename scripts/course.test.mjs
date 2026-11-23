import assert from 'node:assert/strict';
import test from 'node:test';
import { levels } from '../web/course.js';
import { lectureChapters } from '../web/lectures.js';
import { lecturePosition, mayAdvance } from '../web/lecture-view.js';
import {
  RETRY, TIMEOUT, acknowledge, available, begin, countDown, newState, placeItem,
  questionAt, readState, restartCourse, retryState, submit
} from '../web/engine.js';

function solve(state, run, stamp) {
  while (!run.result) {
    const question = questionAt(run);
    run.revealed = true;
    if (question.type === 'map') {
      for (const spot of question.spots) placeItem(run, spot.id, spot.item);
    } else {
      run.selected = Array.isArray(question.correct) ? [...question.correct] : [question.correct];
    }
    submit(state, run, stamp);
    acknowledge(state, run, stamp);
  }
}

test('missing or partially saved data does not block the start screen', () => {
  assert.deepEqual(readState('not JSON'), newState());
  const stored = readState(JSON.stringify({
    lang: 'kk', xp: 30, rewarded: null, passed: { base: true }, runs: { base: null }
  }));
  assert.equal(stored.lang, 'kk');
  assert.equal(stored.xp, 30);
  assert.equal(available(stored, 'shift'), true);
  assert.deepEqual(stored.rewarded, []);
  assert.deepEqual(stored.runs, {});
});

test('a saved diagnostic resumes at the next question', () => {
  const state = newState();
  const run = begin(state, levels[0]);
  run.selected = [questionAt(run).correct];
  submit(state, run);
  const restored = readState(JSON.stringify(state));
  assert.equal(restored.runs.base.index, 1);
  assert.equal(questionAt(restored.runs.base)?.id, questionAt(run)?.id);
});

test('every completed station opens the next one through the final', () => {
  const stamp = 1_800_000_000_000;
  const state = newState();
  assert.equal(available(state, 'shift'), false);
  for (const level of levels) {
    assert.ok(available(state, level.id));
    const run = begin(state, level, stamp, () => 0.4);
    solve(state, run, stamp);
    assert.equal(run.result.passed, true, level.id);
  }
  assert.equal(state.records.final, 20);
});

test('an expired final is saved and a retry becomes available after one day', () => {
  const state = newState();
  const start = 1_800_000_000_000;
  const run = begin(state, levels.at(-1), start);
  const expiry = start + TIMEOUT;
  assert.ok(countDown(run, state, expiry));
  assert.equal(run.result.passed, false);
  assert.equal(retryState(state, expiry).kind, 'waiting');
  assert.equal(retryState(state, expiry + RETRY).kind, 'ready');
});

test('saved games from before lectures open the new section with fresh reading progress', () => {
  const state = readState(JSON.stringify({ xp: 40, lang: 'kk', passed: { base: true } }));
  assert.deepEqual(state.lectureProgress, {});
  assert.equal(state.xp, 40);
  assert.equal(state.lang, 'kk');
  assert.equal(available(state,'shift'), true);
});

test('lecture choices survive reload and reading progress survives an assessment restart', () => {
  const state = newState();
  const chapter = lectureChapters[0];
  const decision = chapter.lines.findIndex(line => line.options);
  const record = lecturePosition(chapter, { index: decision });
  assert.equal(mayAdvance(chapter, record), false);
  record.choices[decision] = 0;
  state.lectureProgress[chapter.id] = record;
  const saved = readState(JSON.stringify(state));
  restartCourse(saved);
  const resumed = lecturePosition(chapter, saved.lectureProgress[chapter.id]);
  assert.equal(resumed.index, decision);
  assert.equal(mayAdvance(chapter, resumed), true);
});
