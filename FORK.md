# Fork changes vs upstream (johannesjo/parallel-code)

This fork carries a small set of patches on top of upstream. Each fork-only
change gets an entry here, in the same commit that introduces it. Sync merges
from upstream update the line below.

Synced with upstream: 2026-07-28 (merge `baf3c03`)

List fork-only commits: `git fork-log`
(alias for `git log --oneline --no-merges upstream/main..fork/main`)

## Active patches

### Preserve container-defined SHELL in Docker tasks

Docker task launches no longer forward the host `SHELL`, which can point to a
host-only binary such as `/opt/homebrew/bin/fish`. Each container image keeps
its own valid `SHELL` declaration instead, while native tasks continue to
inherit the host environment.

Upstreamable. Drop when upstream merges an equivalent.

### Honor OSC 52 so agent panes can copy (`6267dfe`)

TUI agents (Claude Code, Codex) enable mouse reporting, so they own selection
and hand copied text to the terminal via OSC 52. xterm's core parser leaves 52
unhandled and `@xterm/addon-clipboard` isn't a dependency, so the sequence was
dropped: the agent reported "sent N chars via OSC 52" while the system clipboard
never changed. Adds `src/lib/osc52.ts` (payload parser, UTF-8 decode) and
registers an OSC 52 handler in `TerminalView`. Clipboard _reads_ (`?` payload)
are swallowed rather than answered, so anything writing to the PTY cannot
exfiltrate the clipboard.

Upstreamable. Drop when upstream merges an equivalent.

### Share Docker agent auth with MCP sub-tasks (`6fa97d8`)

Sub-task containers spawned by an MCP coordinator now inherit the
"share agent auth across Linux containers" setting, so agents in sub-tasks
reuse persisted logins from `~/.parallel-code/agent-auth/` instead of
starting unauthenticated. Plumbs `shareDockerAgentAuth` from the frontend
store through the MCP-server start IPC into `CoordinatorState` and
`spawnAgent`.

Upstreamable. Drop when upstream merges an equivalent.

### Mount common git dir for linked worktrees in Docker (`5732633`)

Fixes `fatal: not a git repository` inside Docker containers when the task
runs in a linked git worktree:

- The main `.git` dir mount from `resolveWorktreeGitDirMount()` is now added
  for all Docker tasks, not only coordinator sub-tasks.
- Relative `gitdir:` pointers in the worktree's `.git` file are resolved
  against the worktree directory instead of the Electron process cwd.

Upstreamable. Drop when upstream merges an equivalent.

## Maintenance

- Dependency security bumps + `allowScripts` allowlist in `package.json`
  (`fbbceef`) — re-evaluate after each upstream sync; upstream may bump
  the same dependencies independently, in which case prefer upstream's
  lockfile and drop this.

## Dropped patches

(none yet — move entries here when upstream absorbs them, with the upstream
commit/PR that made them obsolete)
