---
name: pad
description: Draw a concept out with the user on a board inside the conversation, until you share one understanding of it.
argument-hint: "What do you want to show?"
disable-model-invocation: true
---

The pad is a drawing board shown inside the conversation: the user draws with the mouse (a folder structure, concepts,
an information hierarchy, a process, a diagram) and you read the drawing back. The goal is **shared understanding**: the
same picture of the subject in both your heads, checked, not assumed.

## 1. Find the subject

- **Passed as an argument:** that is the subject.
- **First message of the conversation:** ask one question: what do you want to show?
- **Mid-conversation:** the subject comes from the conversation: the point where your shared understanding parts right
  now, or something the conversation touches, a level above it. Say which, in one sentence.

Done when the user confirms the subject.

## 2. Open the board

1. Read [`board.html`](board.html), a few lines that load the board from `lossless-hq/lossless-kit` at a pinned
   version. If `prefs.json` sits beside it, write its values into `window.PREFS` (`lock`, `shape`, `line`).
2. Show it inline with the host's render tool, passing the file's full text (T3: `html_render`, height 620). The board
   is already tested: skip any preview step. With no inline tool, open the file in the browser. The board needs the
   internet; offline, it stays blank.
3. Tell the user, in one line, to draw and press **Send** when done.

Every new render is a fresh board: what was drawn on the old one is gone. Render again only when the user asks.

## 3. Read the drawing

**Send** prints, under the board, the drawing as structure: shapes and their nesting, connections from → to, free text,
marker highlights, items grouped by color. Where the host takes a page's `ui/message` (T3, through the fork), the same
structure arrives as the user's next message, headed "From the pad board". Elsewhere, ask the user to paste a screenshot
of the board with the printed structure showing.

Decode it:

- **A closed shape contains** what lies inside it; a shape inside a shape is a level below.
- **A connection is what was bound**, end by end; an open end is unconnected, so treat it as a question, never a guess.
- **Color and shape carry meaning:** a relation, a level, a concept, or emphasis. Group by color first; the user's
  legend wins over yours.
- Ask about every unclear reading, **one question at a time**: the answer to one often settles the next.

## 4. Close on shared understanding

Explain the drawing back in your own words, as structure: what contains what, what leads to what, what each color
groups. Done when the user confirms it is their picture.

When the drawing names a concept the repo already has, check it against `GLOSSARY.md`; when it coins one, offer to record
it there (the `domain-modeling` skill).

## Preferences

A preference the user states about the board (the lock on by default, a default shape or line) goes into `prefs.json`
beside this file, so the next board opens their way.
