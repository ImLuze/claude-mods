import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { PullRequestAction } from '../types'

type Check = { conclusion?: string; state?: string }
type PullRequest = {
  number: number
  title: string
  url: string
  mergeable: string
  mergeStateStatus: string
  reviewDecision: string
  statusCheckRollup: Check[]
}

const FIELDS = 'number,title,url,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup'
const FAILED = ['FAILURE', 'ERROR', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE']
const REFRESH_MS = 60 * 60 * 1000

const prs = atom({ plugin: 'my-prs', key: 'prs' } as const, [])

const actions = (pr: PullRequest) =>
  [
    pr.statusCheckRollup.some(check => FAILED.includes(check.conclusion ?? check.state ?? '')) && 'CI failed',
    pr.reviewDecision === 'CHANGES_REQUESTED' && 'changes requested',
    pr.mergeable === 'CONFLICTING' && 'conflicts',
    pr.mergeStateStatus === 'CLEAN' && 'mergeable',
  ].filter((action): action is string => Boolean(action))

const refresh = async ($: EngineInterface) => {
  const { exitCode, stdout, stderr } = await $.process.run([
    'gh', 'pr', 'list', '--author', '@me', '--state', 'open', '--limit', '100', '--json', FIELDS,
  ])

  if (exitCode !== 0) {
    return stderr.trim()
  }

  const list: PullRequestAction[] = (JSON.parse(stdout) as PullRequest[])
    .map(pr => ({ number: pr.number, title: pr.title, url: pr.url, actions: actions(pr) }))
    .filter(pr => pr.actions.length > 0)
  await update($, prs, () => list)

  return undefined
}

const line = (pr: PullRequestAction) => `#${pr.number} ${pr.title} [${pr.actions.join(', ')}]`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'my-prs',
      description: 'Refresh and list your open pull requests on this repo that need action',
    })
    void refresh($)
    $.clock.every(REFRESH_MS, () => void refresh($))

    return next(e)
  })

  on('command.run', { command: 'my-prs' }, async $ => {
    const error = await refresh($)

    if (error !== undefined) {
      return { text: `gh failed: ${error}` }
    }

    const list = await read($, prs)

    return {
      text: list.length > 0
        ? list.map(pr => `${line(pr)}\n  ${pr.url}`).join('\n')
        : 'No open pull requests need action.',
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, prs)

    if (e.props.hasSurvey || list.length === 0) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {list.slice(0, e.props.maxRows).map(pr => (
          <Text dimColor>PR {line(pr)}</Text>
        ))}
      </Box>
    )
  })
}
