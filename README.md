# lossless-kit

What lossless hands out: skills, a plugin for T3 Code, and the code they load.

## pad

`pad/board.js` is the drawing board of the `pad` skill: the user draws inside the agent conversation, presses Send, and
the board prints the drawing as structure (shapes and their nesting, connections from → to, text, highlights by color).

A page loads it with one script tag, at a pinned version:

```html
<script>window.PREFS = { lock: false, shape: "rect", line: "arrow" };</script>
<script src="https://cdn.jsdelivr.net/gh/lossless-hq/lossless-kit@v0.1.0/pad/board.js"></script>
```

`PREFS`: `lock` keeps a tool on after one use; `shape` is `rect`, `ellipse` or `diamond`; `line` is `arrow`, `line` or
`both`.
