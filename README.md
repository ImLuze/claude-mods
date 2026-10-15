# claude-mods

Mods for Claude Code.

## skill-list

Shows the skills invoked since your last prompt, in a dim line above the prompt.

### Install

At the prompt of a Claude Code terminal session:

```
/plugin install skill-list --marketplace ImLuze/claude-mods
```

From a shell:

```
claude plugin install skill-list --marketplace ImLuze/claude-mods
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `ImLuze/claude-mods`, then Add plugin.

## my-prs

Shows your open pull requests on the current repo that need action (CI failed, changes requested, conflicts, or mergeable) in a dim band above the prompt. Refreshes at session start and every hour; `/my-prs` refreshes now and prints the list with links. Requires an authenticated [`gh`](https://cli.github.com).

### Install

```
/plugin install my-prs --marketplace ImLuze/claude-mods
```
