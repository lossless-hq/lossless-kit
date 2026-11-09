---
name: freestyle
description: Talk a subject out in recordings (a course, a lecture, a presentation, an article, anything still vague); the agent keeps the words verbatim and builds a shared understanding of it.
argument-hint: "What do you want to talk out?"
disable-model-invocation: true
---

The user thinks out loud, in dictated recordings, so the transcript is noisy. The goal is **shared understanding**: the
same picture of the subject in both your heads, built recording by recording. Their words are the material and stay
verbatim; yours are readings and drafts, always marked as yours.

Use the repo's uncertainty markers when it defines them (in `AGENTS.md`), for your inference, an unchecked fact and an
open decision; with none, `[to confirm]`, `[to verify]`, `[open]`. `[?]` marks a word you could not recover. Write in the
document's language.

## 1. Find the subject

- **Passed as an argument:** that is the subject.
- **First message of the conversation:** ask one question: what do you want to talk out?
- **Mid-conversation:** the subject comes from the conversation: the point where your shared understanding parts right
  now, or something the conversation touches, a level above it. Say which, in one sentence.

Done when the user confirms the subject.

## 2. Find its document

1. The subject lives in one file. A map of owners names it when the repo has one; with none, ask once where it lives,
   and create it.
2. Read what it leans on: the repo's agent rules, glossary, principles, open questions, and the document as it stands.
   You need to know which concepts already have an owner elsewhere.
3. Brief the user in a few lines: what the document holds, what is a draft and what is decided. Then invite them to
   talk, from wherever they want.

## 3. Each recording

1. Append it under `## Freestyle (<date>)` → `### In <user>'s words` as the next numbered item: a short bold title
   (yours), then their words in quotes, **verbatim**.
   - Fix recognition errors only: a mangled English term, a misheard letter. When the fix is a guess, note it:
     (originally "…", read as "…").
   - An unrecoverable word gets `[?]`. Ask about it once; if they don't remember, it stays `[?]` or goes.
   - Their correction of a sentence replaces it in place, noted (<user>'s correction, <date>).
2. Update the document around the item, as far as the item reaches:
   - **Already said in**: a table row naming where the idea already lives, with one recommended owner.
   - The subject's plan (its sections table) when the item decides something about it.
   - A decision goes where the repo records decisions (a glossary term, a principle, an open question), signed
     `(<user>, <date>)`.
3. Commit, one commit per recording, its message naming the item and signed.
4. Reply with **what you understood** from the recording, in one sentence of your own; any `[?]`; then the questions
   it opens, as many as the content calls for. The questions are prompts for the next recording: invite the user to
   answer them out loud, and to say whatever else comes up on the way. Their correction of your reading is part of the
   material: record it under the item.

## When they ask you

"What do you recommend", "sharpen this", "organize it", "think of a concept":

1. Make sure what each of their phrases points at. A phrase that could name two things (a series, "that video", "the
   cool tricks") gets one short question before any draft: a draft built on a misreading costs a full round.
2. Write an agent draft: `### Content draft: <topic> (agent, <inference marker>, not <user>'s words)`. The content
   layer only (what is said, in what order), never sentences for them to read aloud.
3. **One recommendation.** A menu of options, or a question they already answered, reads as noise.
4. Every factual claim in it carries the unchecked-fact marker, and a background agent checks it against primary
   sources. When it returns, add a **Checked** section with the sources and lift the markers. Facts are checked, never
   asked of the user.

Their verdict:

- **Approved** → `OK (<user>, <date>): "<their words>"` on that line alone.
- **Rejected** → the draft stays, headed **Not adopted:** with why, so no later session proposes it again.
- **"Leave it as a question"** → an open question in the repo's open-questions file, pointing back to the items.

## Throughout

- **Signed lines**: only what the user said or approved carries their name.
- "Where are we?" gets three things: where we are, the last thing done, what's next. No new question.

## Closing

When the user says they have covered most of it:

1. List what is still open in the document (inference and open markers, `[?]`, parts of the plan never spoken about),
   in the order you would close them, with one recommendation of where to start.
2. What they mark as aside, background or later is recorded that way in the plan, and stops being open.
3. Explain the subject back in your own words, a short paragraph. Done when the user confirms it is their picture.
