---
name: split
description: Open a child conversation or a subagent from this conversation.
argument-hint: "[child|sub] [on <harness> <model>:] <task>"
disable-model-invocation: true
---

The person asked to open something from this conversation. Do it now, then go back to what you were doing.

## Ask what is missing

A request without a task: ask for it first, in one line of chat. A request that names a model has chosen: open it without asking.

Otherwise, with your question tool, ask at most three screens, one question each, skipping what the request named. After the last answer, open it at once.

1. **Kind:** child or sub.
2. **Child: harness. Sub: a model of this conversation's harness.** A sub opens here.
3. **Child: a model of the chosen harness.**

Each list comes from what the environment offers (T3: `orchestrator_capabilities`), with the current value first: the value's own name as the label, and "current" as its small description. A custom answer takes any other. Without a question tool, ask in a message.

## child: a conversation of its own

Open a new conversation under this one, with the task as its first message (T3: `t3_thread_launch`). Choose a plain conversation over a delegated task that reports back each turn: a conversation returns nothing, and what matters goes into the copy and a commit.

Its place comes from `git branch --show-current` and `git rev-parse --show-toplevel`:

- On the default branch, this conversation is the trunk, and what it launches starts a new unit of work: a new branch named for the task, in a new worktree (T3: `workspaceStrategy` `worktree`).
- In a linked worktree, the child joins this unit of work, in the same folder (T3: `existing_worktree`, with `worktreePath`).
- In the main checkout on another branch, the child joins this unit of work, in the same folder (T3: `root`).

Where the environment cannot open a conversation from here, give the person the task ready to paste, the folder and branch to open it in, and the model.

## sub: a helper inside this conversation

It does one task and returns its result here. Run it the way this environment directs, in the background unless the person asked to wait. Report its result when it ends. Where the environment has no such helper, say so and offer a child.

## Model and harness

The current value means leave it out. For a child, pass the exact names the environment lists (T3: `instanceId` and `model` in `modelSelection`). A subagent takes a model only.

When a name matches nothing, say so and open nothing.
