export type SkillNames = string[]

declare module 'claude-code' {
  interface PluginState {
    'skill-list': { skills: SkillNames }
  }
}
