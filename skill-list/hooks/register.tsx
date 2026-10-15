import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const skills = atom({ plugin: 'skill-list', key: 'skills' } as const, [])
const USER_ORIGINS = ['composer', 'bridge', 'sdk']

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    if (USER_ORIGINS.includes(e.origin.kind) && (await read($, skills)).length > 0) {
      await update($, skills, () => [])
    }

    return next(e)
  })

  on('skill.prompt', async ($, e, next) => {
    await update($, skills, list => [...list, e.skill])

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, skills)

    if (e.props.hasSurvey || list.length === 0) {
      return next(e)
    }

    const { Text } = $.ui.resolve(e)

    return (
      <Text dimColor>
        Skills: {list.join(', ')}
      </Text>
    )
  })
}
