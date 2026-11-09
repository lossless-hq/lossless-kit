---
name: merge-branch
description: Merge this unit of work into its base: check nothing is left behind, rebase, test, open a PR, and hand the last step to the trunk.
argument-hint: "The base branch when it is not main; in the conversation that owns the base, the PR number"
disable-model-invocation: true
---

A unit of work is every conversation on one branch in one copy. A merge always takes the same process, so it runs the same for any base. The base is `main` unless the person names another.

Given a PR number, go to step 6. Otherwise run from any conversation of the unit.

## 1. Check the unit

The unit's conversations share one copy, so `git status` covers the files and not the rest:

- **Conversations:** list the unit's root and every descendant from the environment (T3: `t3_thread_list`), or ask the person where it has no such list. Any that is running stops the merge until it ends: name it to the person. Read each one's last turns, and commit what matters that lives only there.
- **Copy:** every change is committed, or the person said to leave it out.
- **Pages:** whatever a `/tmp` page of this unit holds that still matters is in a commit.

Done when each conversation has ended with nothing left only in it, and `git status` is clean.

**Empty unit:** `git log origin/<base>..` shows no commit, so the work went to other repos. Go to the copy's removal in step 6, run from outside the copy (`git -C <main checkout> worktree remove <path>`), and tell the person where the work went.

## 2. Rebase

Run it here, in the unit's copy: this is where the work is understood.

```bash
git fetch origin
git rebase origin/<base>
```

During a rebase `ours` is the base and `theirs` is the unit's commit, the reverse of a merge. Read both sides of each conflict and keep the intent of both. Turn on `git config rerere.enabled true` first, so a conflict that returns in a later commit is solved once.

A branch already pushed needs `git push --force-with-lease origin <branch>` after this. Where the environment blocks it, give the person the command.

Done when `git log origin/<base>..` shows only the unit's commits.

## 3. Test

Run the unit and e2e checks the repo defines. A failure goes back into the unit and returns to step 1.

Done when every check passes on the rebased branch.

## 4. Open the PR

Push the branch and open a PR into the base, in the form the repo uses.

## 5. Hand over

Stop here. Give the person the PR's link and this: once it is approved, write `/merge-branch <PR>` in the conversation that owns the base, the trunk for `main`.

## 6. Merge

Only the conversation that owns the base runs this. Confirm the PR is approved and its checks are green, then merge with a merge commit (on GitHub below; elsewhere, the code host's equivalent):

```bash
gh pr merge <PR> --merge
git pull --ff-only
```

`--merge` keeps a merge commit: each unit stays visible in the history as its own bump, with its small commits, and `git log --first-parent` reads one line per unit. The branch stays, since its name records what was done.

Remove the unit's copy once `git status` there is clean: `git worktree remove <path>`.

Done when the base holds the merge commit, this copy matches `origin`, and the unit's copy is gone.
