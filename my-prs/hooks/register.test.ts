import { expect, test } from 'claude-code/testing'

const RUN = {
  command: 'my-prs',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 80 },
} as const
const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 5, bodyColumns: 80, scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

const pr = (number: number, fields: object) => ({
  number,
  title: `PR ${number}`,
  url: `https://github.com/o/r/pull/${number}`,
  mergeable: 'MERGEABLE',
  mergeStateStatus: 'BLOCKED',
  reviewDecision: 'REVIEW_REQUIRED',
  statusCheckRollup: [{ conclusion: 'SUCCESS' }],
  ...fields,
})

const gh = (exitCode: number, stdout: string, stderr = '') =>
  ({ value: { exitCode, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false } })

test('lists pull requests that need action, in the command and above the prompt', async ($, on) => {
  on('process.run', () => gh(0, JSON.stringify([
    pr(1, { statusCheckRollup: [{ conclusion: 'SUCCESS' }, { conclusion: 'FAILURE' }] }),
    pr(2, { reviewDecision: 'CHANGES_REQUESTED', mergeable: 'CONFLICTING', mergeStateStatus: 'DIRTY' }),
    pr(3, { mergeStateStatus: 'CLEAN', reviewDecision: 'APPROVED' }),
    pr(4, { statusCheckRollup: [{ state: 'ERROR' }] }),
    pr(5, {}),
  ])))
  on('command.run', () => ({ text: '' }))
  on('ui.render', ($, e) => h($.ui.resolve(e).Box, {}) as never)

  expect((await $.command.run(RUN)).text).toBe(
    [
      '#1 PR 1 [CI failed]\n  https://github.com/o/r/pull/1',
      '#2 PR 2 [changes requested, conflicts]\n  https://github.com/o/r/pull/2',
      '#3 PR 3 [mergeable]\n  https://github.com/o/r/pull/3',
      '#4 PR 4 [CI failed]\n  https://github.com/o/r/pull/4',
    ].join('\n'),
  )

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'my-prs', surface, ...BAND })
    expect((await ui.find({ type: 'Text', text: /#2/ }))?.text).toMatch(/#2 PR 2 \[changes requested, conflicts\]$/)
    expect((await ui.find({ type: 'Link', text: /#2 PR 2$/ }))?.props.href).toBe('https://github.com/o/r/pull/2')
    expect((await ui.find({ type: 'Text', text: /^conflicts$/ }))?.props.color).toBe('error')
    expect((await ui.find({ type: 'Text', text: /^changes requested$/ }))?.props.color).toBe('warning')
    expect((await ui.find({ type: 'Text', text: /^mergeable$/ }))?.props.color).toBe('success')
    expect(await ui.find({ type: 'Text', text: /#5/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('shows nothing when no pull request needs action', async ($, on) => {
  on('process.run', () => gh(0, JSON.stringify([pr(5, {})])))
  on('command.run', () => ({ text: '' }))
  on('ui.render', ($, e) => h($.ui.resolve(e).Box, {}) as never)

  expect((await $.command.run(RUN)).text).toBe('No open pull requests need action.')
  const ui = await $.ui.mount({ plugin: 'my-prs', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: /PR/ })).toBeUndefined()
  await ui.unmount()
})

test('reports gh errors', async ($, on) => {
  on('process.run', () => gh(1, '', 'not a git repository\n'))
  on('command.run', () => ({ text: '' }))

  expect((await $.command.run(RUN)).text).toBe('gh failed: not a git repository')
})
