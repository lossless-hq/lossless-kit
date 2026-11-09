---
name: attention
description: Pick up where the last session stopped, or hand this one off.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Where it goes depends on the conversation's first message:

- `/attention` alone → the trunk: `docs/HANDOFF.md` under the root of the repo where the next session opens (the git repo root, or the current working directory when not in a repo), overwriting the one there.
- `/attention <path>` → any other conversation: that same path, under `/tmp`, uncommitted.
- anything else → ask the person whether this conversation is the trunk. If not, write to a new `/tmp/handoff-<short-name>.md`.

**Read the file you are about to replace before you replace it**: an open item left out is an open item lost.

**Triage every item**, the old file's and this session's alike. Each gets one **verdict**, checked against the repo, not taken from memory:

- **Close**: small and within reach now (a stale link, a doc that lags the code). Do it and commit it; it leaves the handoff.
- **Drop**: the code, the tracker or `git log` shows it resolved, or the user said so.
- **Carry**: still true in the code (a gotcha, a debt, a deferred refactor), or a decision of the user's still standing. It moves across silently.
- **Ask**: a decision only the user can make (product, priority, money, their own accounts) that they raised or were asked. What an agent inferred on its own (a proposed answer, a rule, a plan) is the agent's to close or drop.

The triage is done when every item has a verdict. Then send the user one short message: what you closed and dropped, one line each with what showed it, and the ask items in their product's words. Write after their answer; with no ask items, write straight away. The user's list holds only what they alone can do.
Then, on `docs/HANDOFF.md`, commit the page alone (`handoff: <what the next session is for>`): git keeps every version, and the next session
finds it on any machine, worktree or cloud session. Where the repo's `.gitignore` keeps the page out, the overwrite is
the only copy.

Last, open the next session with the page's command, `/attention` or `/attention <path>`. If a tool sends a message in a clean context, send the command through it to this conversation. If not, tell the person what to write.

When `/attention` is the first message of the conversation, pick up instead: read the file it names (`docs/HANDOFF.md` when it names none) and brief the user from it, leaving it as it is. No file there → say so and stop.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
