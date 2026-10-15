export type PullRequestAction = { number: number; title: string; url: string; actions: string[] }

declare module 'claude-code' {
  interface PluginState {
    'my-prs': { prs: PullRequestAction[] }
  }
}
