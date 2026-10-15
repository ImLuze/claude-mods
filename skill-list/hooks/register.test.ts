import { expect, test } from 'claude-code/testing'

const PROMPT = { wait: false, origin: { kind: 'composer' } } as const
const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 5, bodyColumns: 80, scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

test('lists invoked skills and resets on the next prompt', async ($, on) => {
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('skill.prompt', ($, e) => ({ text: e.text }))
  on('ui.render', ($, e) => h($.ui.resolve(e).Box, {}) as never)

  for (const surface of ['terminal', 'desktop'] as const) {
    await $.prompt.submit({ ...PROMPT, text: 'go' })
    await $.skill.prompt({ skill: 'commit', text: '' })
    await $.skill.prompt({ skill: 'simplify', text: '' })
    await $.prompt.submit({ ...PROMPT, origin: { kind: 'task-notification' }, text: 'bg done' })

    const ui = await $.ui.mount({ plugin: 'skill-list', surface, ...BAND })
    expect((await ui.find({ type: 'Text', text: /Skills/ }))?.text).toBe('Skills: commit, simplify')
    await ui.unmount()

    await $.prompt.submit({ ...PROMPT, text: 'again' })
    const after = await $.ui.mount({ plugin: 'skill-list', surface, ...BAND })
    expect(await after.find({ type: 'Text', text: /Skills/ })).toBeUndefined()
    await after.unmount()
  }
})
