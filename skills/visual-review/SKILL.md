---
name: visual-review
description: Go over a finished output with the user by eye (deck, PDF, image, document), marking on its pages in place until nothing is unclear. The output already exists; this skill shows it, it does not create it.
argument-hint: "Which file do you want to review?"
disable-model-invocation: true
---

The output is the person's own, made elsewhere. Show it the way its reader will see it, as pages the person marks, and
fix what they mark at its source. The page you show is a view: the fix lands in whatever builds the output.

`scripts/pages.py` does the whole chain: file, PDF, one image per page, `imgslim`, one self-contained `review.html` with
the viewer (`scripts/viewer.js`) inside. It needs LibreOffice for decks and documents, PyMuPDF (or `pdftoppm`) for PDFs,
and `imgslim` when the machine has it.

## 1. Find the output

The file is the argument, or the one question "which file?" on a first message, or the file you last built. Find what
builds it (a script, a template).

Done when the file's path and its builder, if any, are settled.

## 2. Make the page

Run `scripts/pages.py <file> --title "<name>"`. The output folder empties itself on every run, so one round is one
command.

Done when it prints the page's path and a page count equal to the output's. A missing tool stops it with the tool named:
ask the person, install after their yes, run again.

## 3. Show it

Open `review.html` in the host's own web view; the page is one file that needs no internet.

- **T3:** serve its folder on `127.0.0.1` from a free port (`python3 -m http.server <port> --bind 127.0.0.1`, in the
  background) and open the address in the preview tab at its current size.
- **Claude desktop and other hosts:** the host's own browser or artifact pane.
- **No pane:** give the absolute path for the person to open.

The viewer carries its own marking, so a host's annotate tool is optional. Tell the person, in one line: drag on a page
to mark, type, press **Send**.

Done when the person sees the pages.

## 4. Read the marks

**Send** prints the marks under the pages: each one a page, a place on it, the person's words. Where the host takes a
page's `ui/message` (T3, through the fork), they arrive as the person's next message headed "From the review viewer";
elsewhere the person pastes them.

A mark is a place and a question. Ask about a reading that splits two ways, one question at a time, and treat marks that
say the same thing as one problem with one cause.

Done when every mark has a reading you share with the person.

## 5. Fix at the source

Change what builds the output, rebuild, run step 2 again, and look at each changed page through the `slimimg` skill. Say
what changed, one line per mark, and wait for the person's reaction. A new run is a fresh viewer, so the old marks are
gone: the lines you wrote are the record.

Done when the person sends no more marks.

## 6. Close

Stop the server you started. Return the file's path and the marks left open.
