import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../lib/exam/answer-save-queue.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } })
const { AnswerSaveQueue } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('automatically retries an outage answer and clears the error only after acknowledgement', async () => {
  const recovered = deferred(), states = []
  let calls = 0, persisted
  const queue = new AnswerSaveQueue(async answer => {
    if (++calls === 1) throw new Error('offline')
    persisted = answer.value
  }, state => {
    states.push(state)
    if (states.some(s => s.hasError) && !state.pendingQuestionIds.length) recovered.resolve()
  }, 5)
  try {
    queue.enqueue({ questionId: 1, value: 'True' })
    await recovered.promise
    assert.equal(persisted, 'True')
    assert.equal(calls, 2)
    assert.ok(states.some(s => s.hasError && s.pendingQuestionIds.includes(1)))
    assert.deepEqual(states.at(-1), { hasError: false, pendingQuestionIds: [] })
  } finally { queue.stop() }
})

test('serializes in-flight saves and coalesces newer edits so the final answer cannot be overwritten', async () => {
  const gate = deferred(), calls = []
  let active = 0, peak = 0, persisted
  const queue = new AnswerSaveQueue(async answer => {
    peak = Math.max(peak, ++active)
    calls.push(answer.value)
    if (calls.length === 1) await gate.promise
    persisted = answer.value
    active--
  }, () => {})
  try {
    queue.enqueue({ questionId: 1, value: 'old' })
    queue.enqueue({ questionId: 1, value: 'intermediate' })
    queue.enqueue({ questionId: 1, value: 'latest' })
    const flush = queue.flush()
    assert.deepEqual(calls, ['old'])
    gate.resolve()
    assert.equal(await flush, true)
    assert.deepEqual(calls, ['old', 'latest'])
    assert.equal(persisted, 'latest')
    assert.equal(peak, 1)
  } finally { queue.stop() }
})

test('a failed flush prevents submission and a recovered flush submits after every answer is saved', async () => {
  let offline = true, submitted = 0
  const persisted = new Map()
  const queue = new AnswerSaveQueue(async answer => {
    if (offline) throw new Error('offline')
    persisted.set(answer.questionId, answer.value)
  }, () => {}, 60000)
  const submit = async () => { if (!await queue.flush()) return false; submitted++; return true }
  try {
    queue.enqueue({ questionId: 1, value: 'old' })
    assert.equal(await submit(), false)
    assert.equal(submitted, 0)
    queue.enqueue({ questionId: 1, value: 'latest' })
    queue.enqueue({ questionId: 2, value: 'second' })
    await queue.flush()
    offline = false
    assert.equal(await submit(), true)
    assert.equal(submitted, 1)
    assert.deepEqual([...persisted], [[1, 'latest'], [2, 'second']])
  } finally { queue.stop() }
})

test('an empty flush cannot strand an edit enqueued in the same microtask turn', async () => {
  const calls = []
  const queue = new AnswerSaveQueue(async answer => { calls.push(answer.value) }, () => {})
  try {
    const empty = queue.flush()
    queue.enqueue({ questionId: 1, value: 'new' })
    await empty
    assert.equal(await queue.flush(), true)
    assert.deepEqual(calls, ['new'])
  } finally { queue.stop() }
})

test('re-enqueuing the same answer object while in flight still saves the new revision', async () => {
  const gate = deferred(), calls = []
  const queue = new AnswerSaveQueue(async answer => {
    calls.push(answer.value)
    if (calls.length === 1) await gate.promise
  }, () => {})
  try {
    const answer = { questionId: 1, value: 'old' }
    queue.enqueue(answer)
    answer.value = 'new'
    queue.enqueue(answer)
    gate.resolve()
    assert.equal(await queue.flush(), true)
    assert.deepEqual(calls, ['old', 'new'])
  } finally { queue.stop() }
})

test('a failed retry retains the visible error and all pending answers', async () => {
  const states = []
  const queue = new AnswerSaveQueue(async () => { throw new Error('offline') }, state => states.push(state), 60000)
  try {
    queue.enqueue({ questionId: 1, value: 'first' })
    await queue.flush()
    const errorIndex = states.findIndex(s => s.hasError)
    queue.enqueue({ questionId: 2, value: 'second' })
    assert.equal(await queue.flush(), false)
    assert.ok(states.slice(errorIndex).every(s => s.hasError))
    assert.deepEqual(states.at(-1).pendingQuestionIds, [1, 2])
  } finally { queue.stop() }
})

test('stopping cancels retries and prevents completion callbacks from an in-flight request', async () => {
  const gate = deferred(), states = []
  let calls = 0
  const queue = new AnswerSaveQueue(async () => { calls++; await gate.promise; throw new Error('offline') }, state => states.push(state), 5)
  queue.enqueue({ questionId: 1, value: 'pending' })
  const flush = queue.flush()
  queue.stop()
  gate.resolve()
  assert.equal(await flush, false)
  await new Promise(resolve => setTimeout(resolve, 15))
  assert.equal(calls, 1)
  assert.equal(states.length, 1)
})
