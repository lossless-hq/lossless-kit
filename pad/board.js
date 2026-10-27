// The pad board: a drawing board shown inside an agent conversation. A page loads it with one script tag, after
// setting window.PREFS; this file brings its own style and markup.
(() => {
const style = document.createElement("style");
style.textContent = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: var(--font-sans); color: var(--foreground); }
  .board { position: relative; height: 560px; border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--card); overflow: hidden; touch-action: none; }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: crosshair; }
  .board.text canvas { cursor: text; }
  .board.select canvas { cursor: default; }
  .panel { position: absolute; z-index: 2; display: grid; gap: 6px; padding: 8px;
    background: var(--popover); border: 1px solid var(--border); border-radius: var(--radius);
    box-shadow: 0 2px 10px rgb(0 0 0 / .08); }
  .tools { left: 10px; top: 10px; grid-template-columns: 1fr 1fr; width: 208px; }
  .full { grid-column: 1 / -1; }
  .tools.folded { grid-template-columns: auto; min-width: 0; width: auto; }
  .tools.folded > :not(#fold):not(#send) { display: none; }
  .colhead { font-size: 11px; height: 14px; color: var(--muted-foreground); text-align: center; white-space: nowrap; }
  .actions { right: 10px; top: 10px; grid-auto-flow: column; }
  .panel button { font: inherit; font-size: 13px; height: 30px; padding: 0 8px; border-radius: calc(var(--radius) - 2px);
    border: 1px solid var(--border); background: var(--secondary); color: var(--secondary-foreground); cursor: pointer;
    white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; }
  .panel svg, .menu svg { width: 15px; height: 15px; flex: none; fill: none; stroke: currentColor; stroke-width: 2;
    stroke-linecap: round; stroke-linejoin: round; }
  .menu svg { width: 22px; height: 18px; stroke-width: 1.75; }
  .split > button.more { justify-content: center; }
  .panel button.on { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }
  .panel #send { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }
  .panel button:disabled { opacity: .4; cursor: default; }
  .split { display: grid; grid-template-columns: 1fr 22px; }
  .split > button:first-child { border-start-end-radius: 0; border-end-end-radius: 0; }
  .split > button.more { padding: 0; border-start-start-radius: 0; border-end-start-radius: 0; border-inline-start: 0; font-size: 10px; }
  .menu { position: absolute; z-index: 4; display: none; flex-direction: column; gap: 2px; padding: 4px; min-width: 150px;
    background: var(--popover); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: 0 4px 14px rgb(0 0 0 / .12); }
  .menu.open { display: flex; }
  .menu button { font: inherit; font-size: 13px; height: 30px; padding: 0 8px; border: 0; border-radius: 4px;
    background: transparent; color: var(--popover-foreground); cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .menu button:hover, .menu button.on { background: var(--accent); color: var(--accent-foreground); }
  .rule { grid-column: 1 / -1; height: 1px; background: var(--border); }
  .swatches { grid-column: 1 / -1; display: flex; justify-content: space-between; }
  .panel .sw { width: 20px; height: 20px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 0; }
  .panel .sw.on { border-color: var(--foreground); }
  .board input { position: absolute; z-index: 3; font: 15px var(--font-sans); color: var(--foreground); background: var(--popover);
    border: 1px solid var(--ring); border-radius: 4px; padding: 2px 4px; min-width: 120px; }
  pre { font: 12px/1.5 var(--font-mono); background: var(--code-background); padding: 12px 16px;
    border-radius: var(--radius); white-space: pre-wrap; margin: 8px 0 0; display: none; }
  .hint { font-size: 12px; color: var(--muted-foreground); margin-top: 6px; min-height: 16px; }
`;
document.head.appendChild(style);
document.body.insertAdjacentHTML("afterbegin", `
<div class="board" id="board">
  <canvas id="c"></canvas>
  <div class="panel tools">
    <button class="full" id="fold" title="Fold the tools up (F)" data-icon="fold">Hide tools</button>
    <button class="full" data-tool="select" data-key="v" title="Select (V)" data-icon="select">Select</button>
    <div class="colhead">Stays</div>
    <div class="colhead" id="oneshot">Once</div>
    <button data-tool="pen" data-key="p" title="Pen (P)" data-icon="pen">Pen</button>
    <button data-tool="text" data-key="t" title="Text (T)" data-icon="text">Text</button>
    <button data-tool="marker" data-key="h" title="Marker (H)" data-icon="marker">Marker</button>
    <div class="split"><button data-tool="shape" data-key="r" id="shapeBtn" title="Shape (R)"></button><button class="more" data-menu="shapeMenu" title="More shapes">▾</button></div>
    <button data-tool="eraser" data-key="e" title="Eraser (E)" data-icon="eraser">Eraser</button>
    <div class="split"><button data-tool="line" data-key="a" id="lineBtn" title="Arrow (A)"></button><button class="more" data-menu="lineMenu" title="More lines">▾</button></div>
    <button id="send" data-icon="send">Send</button>
    <button id="lock" title="Lock: the tool stays on after use (Q)"></button>
    <div class="rule"></div>
    <div class="swatches" id="colors"></div>
    <button id="smaller" title="Smaller text ([)">A− Smaller</button>
    <button id="bigger" title="Bigger text (])">A+ Bigger</button>
  </div>
  <div class="panel actions">
    <button id="undo" title="⌘Z" data-icon="undo">Undo</button>
    <button id="redo" title="⇧⌘Z" data-icon="redo">Redo</button>
    <button id="dup" title="Duplicate (⌘D, or Alt+drag)" data-icon="dup">Duplicate</button>
    <button id="clear" data-icon="clear">Clear</button>
  </div>
  <div class="menu" id="shapeMenu"></div>
  <div class="menu" id="lineMenu"></div>
</div>
<pre id="out"></pre>
<div class="hint" id="hint"></div>
`);

// Per-person preferences: the page that loads this sets window.PREFS.
const PREFS = Object.assign({ lock: false, shape: "rect", line: "arrow" }, window.PREFS);
const COLORS = ["var(--foreground)", "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--destructive)"];
const NAMES = ["ink", "blue", "teal", "orange", "purple", "red"];
const SHAPES = { rect: "Box", ellipse: "Circle", diamond: "Diamond" };
const LINES = { arrow: "Arrow", line: "Line", both: "Two-way arrow" };
// Lucide-style strokes, 24×24. Shapes and lines draw themselves in the ▾ menus.
const ICONS = {
  select: '<path d="M4.04 4.69a.5.5 0 0 1 .65-.65l16 6.5a.5.5 0 0 1-.06.95l-6.13 1.58a2 2 0 0 0-1.43 1.43l-1.58 6.13a.5.5 0 0 1-.95.06z"/>',
  pen: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
  text: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
  marker: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
  eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
  fold: '<path d="m18 15-6-6-6 6"/>',
  unfold: '<path d="m6 9 6 6 6-6"/>',
  send: '<path d="M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.63l-19 6.5a.5.5 0 0 0-.02.93l7.93 3.18a2 2 0 0 1 1.11 1.11z"/><path d="m21.85 2.15-10.94 10.94"/>',
  unlocked: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  locked: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  dup: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  clear: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2"/>',
  rect: '<rect x="3" y="5" width="18" height="14" rx="2"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="9" ry="7"/>',
  diamond: '<path d="M12 3 21 12 12 21 3 12z"/>',
  arrow: '<path d="M3 12h17"/><path d="m15 7 5 5-5 5"/>',
  line: '<path d="M3 12h18"/>',
  both: '<path d="M4 12h16"/><path d="m9 7-5 5 5 5"/><path d="m15 7 5 5-5 5"/>',
};
const icon = k => '<svg viewBox="0 0 24 24">' + ICONS[k] + '</svg>';
const label = (k, text) => icon(k) + '<span>' + text + '</span>';
document.querySelectorAll("[data-icon]").forEach(b => b.innerHTML = label(b.dataset.icon, b.textContent));
const ONE_SHOT = new Set(["text", "shape", "line"]);
const HINTS = {
  select: "Click selects, drag moves, handles resize. A color recolors the selection, A− A+ size text, ⌘D or Alt+drag duplicates, Delete removes.",
  text: "Click the board to type a line. A− A+ set its size. Text inside a shape becomes its name.",
  shape: "Drag to draw a shape. A shape inside a shape is a hierarchy. ▾ switches the shape.",
  line: "Start and release inside a shape or text to connect; what is highlighted is what connects. A hollow ring is an open end. ▾ switches the kind.",
};
const board = document.getElementById("board"), cv = document.getElementById("c"), ctx = cv.getContext("2d");
let tool = "pen", color = 0, items = [], cur = null, drag = null, sel = null, lock = PREFS.lock;
let shapeKind = PREFS.shape, lineKind = PREFS.line;
let past = [], future = [], textSize = 15, hover = null;
const newId = () => Math.random().toString(36).slice(2, 9);
const SIZES = [11, 13, 15, 18, 22, 28, 36];

const css = v => getComputedStyle(document.body).getPropertyValue(v.slice(4, -1)).trim() || "#888";
const paint = i => css(COLORS[i]);

// History is a snapshot before every change, so undo covers moves, recolors and erases too.
const snap = () => JSON.stringify(items);
function commit(before) { if (before === snap()) return; past.push(before); future = []; syncHistory(); }
function doUndo() { if (!past.length) return; future.push(snap()); items = JSON.parse(past.pop()); sel = null; syncHistory(); draw(); }
function doRedo() { if (!future.length) return; past.push(snap()); items = JSON.parse(future.pop()); sel = null; syncHistory(); draw(); }
function syncHistory() { document.getElementById("undo").disabled = !past.length; document.getElementById("redo").disabled = !future.length; }

const colorsEl = document.getElementById("colors");
COLORS.forEach((c, i) => {
  const b = document.createElement("button");
  b.className = "sw" + (i === 0 ? " on" : ""); b.title = NAMES[i]; b.style.background = c;
  b.onclick = () => {
    color = i; [...colorsEl.children].forEach((x, j) => x.classList.toggle("on", j === i));
    if (sel) { const before = snap(); sel.c = i; commit(before); draw(); }
  };
  colorsEl.appendChild(b);
});
function pick(name) {
  tool = name; if (name !== "select") sel = null; closeMenus();
  document.querySelectorAll("[data-tool]").forEach(x => x.classList.toggle("on", x.dataset.tool === name));
  board.classList.toggle("text", tool === "text"); board.classList.toggle("select", tool === "select");
  document.getElementById("hint").textContent = HINTS[name] || "";
  draw();
}
const afterUse = () => { if (!lock && ONE_SHOT.has(tool)) pick("select"); };
document.querySelectorAll("[data-tool]").forEach(b => b.onclick = () => pick(b.dataset.tool));

// Split buttons: the face draws with the last kind chosen, the ▾ opens the other kinds.
function setShape(k) { shapeKind = k; document.getElementById("shapeBtn").innerHTML = label(k, SHAPES[k]); }
function setLine(k) { lineKind = k; document.getElementById("lineBtn").innerHTML = label(k, k === "both" ? "Two-way" : LINES[k]); }
function fillMenu(id, kinds, current, choose, toolName) {
  const m = document.getElementById(id); m.innerHTML = "";
  Object.entries(kinds).forEach(([k, name]) => {
    const b = document.createElement("button"); b.innerHTML = icon(k) + "<span>" + name + "</span>"; b.classList.toggle("on", k === current);
    b.onclick = () => { choose(k); pick(toolName); }; m.appendChild(b);
  });
}
function closeMenus() { document.querySelectorAll(".menu").forEach(m => m.classList.remove("open")); }
document.querySelectorAll(".more").forEach(b => b.onclick = e => {
  e.stopPropagation();
  const id = b.dataset.menu, m = document.getElementById(id), open = m.classList.contains("open");
  closeMenus(); if (open) return;
  if (id === "shapeMenu") fillMenu(id, SHAPES, shapeKind, setShape, "shape");
  else fillMenu(id, LINES, lineKind, setLine, "line");
  const r = b.parentElement.getBoundingClientRect(), br = board.getBoundingClientRect();
  m.style.left = (r.left - br.left) + "px"; m.style.top = (r.bottom - br.top + 4) + "px"; m.classList.add("open");
});
document.addEventListener("pointerdown", e => { if (!e.target.closest(".menu") && !e.target.closest(".more")) closeMenus(); });
setShape(shapeKind); setLine(lineKind);

const lockBtn = document.getElementById("lock");
function setLock(v) { lock = v; lockBtn.innerHTML = v ? label("locked", "Locked") : label("unlocked", "Lock"); lockBtn.classList.toggle("on", v);
  document.getElementById("oneshot").textContent = v ? "Stays (locked)" : "Once"; }
lockBtn.onclick = () => setLock(!lock);
// The tools fold up to one row, so the whole board is free to draw on; Send stays at hand.
const foldBtn = document.getElementById("fold"), toolsEl = document.querySelector(".tools");
function setFold(v) { toolsEl.classList.toggle("folded", v); foldBtn.innerHTML = v ? label("unfold", "Tools") : label("fold", "Hide tools"); closeMenus(); }
foldBtn.onclick = () => setFold(!toolsEl.classList.contains("folded"));
setLock(lock);
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") { e.preventDefault(); if (sel && items.includes(sel)) duplicate(sel); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if ((e.key === "Delete" || e.key === "Backspace") && sel) { const before = snap(); items.splice(items.indexOf(sel), 1); sel = null; commit(before); draw(); return; }
  if (e.key === "Escape") { sel = null; closeMenus(); draw(); return; }
  if (e.key.toLowerCase() === "q") return setLock(!lock);
  if (e.key.toLowerCase() === "f") return setFold(!toolsEl.classList.contains("folded"));
  if (e.key === "[" || e.key === "]") return resize(e.key === "]" ? 1 : -1);
  const b = document.querySelector('[data-key="' + e.key.toLowerCase() + '"]'); if (b) pick(b.dataset.tool);
});

function size() {
  const r = board.getBoundingClientRect(), d = devicePixelRatio || 1;
  cv.width = r.width * d; cv.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); draw();
}
new ResizeObserver(size).observe(board);
window.addEventListener("message", () => setTimeout(draw, 0));

function arrowHead(x1, y1, x2, y2) {
  const a = Math.atan2(y2 - y1, x2 - x1), s = 11;
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45));
  ctx.lineTo(x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45));
  ctx.closePath(); ctx.fill();
}
const font = it => (it.z || 15) + "px " + css("var(--font-sans)");
const textWidth = it => { ctx.font = font(it); return ctx.measureText(it.s).width; };
const rtl = s => /^[^A-Za-z\u0590-\u08FF]*[\u0590-\u08FF]/.test(s);
function bounds(it) {
  if (it.p) { const xs = it.p.map(p => p[0]), ys = it.p.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
  if (it.t === "text") return [it.x, it.y, it.x + textWidth(it), it.y + (it.z || 15) * 1.2];
  return [Math.min(it.x1, it.x2), Math.min(it.y1, it.y2), Math.max(it.x1, it.x2), Math.max(it.y1, it.y2)];
}
function shapePath(it) {
  const [l, t, r, b] = bounds(it), cx = (l + r) / 2, cy = (t + b) / 2;
  ctx.beginPath();
  if (it.k === "ellipse") ctx.ellipse(cx, cy, (r - l) / 2, (b - t) / 2, 0, 0, Math.PI * 2);
  else if (it.k === "diamond") { ctx.moveTo(cx, t); ctx.lineTo(r, cy); ctx.lineTo(cx, b); ctx.lineTo(l, cy); ctx.closePath(); }
  else ctx.roundRect(l, t, r - l, b - t, 8);
}
function drawItem(it) {
  ctx.save(); ctx.strokeStyle = ctx.fillStyle = paint(it.c); ctx.lineCap = ctx.lineJoin = "round";
  if (it.t === "pen" || it.t === "marker") {
    ctx.lineWidth = it.t === "pen" ? 2.5 : 18; ctx.globalAlpha = it.t === "pen" ? 1 : 0.3;
    ctx.beginPath(); it.p.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  } else if (it.t === "shape") {
    ctx.lineWidth = 2; shapePath(it); ctx.stroke();
  } else if (it.t === "line") {
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(it.x1, it.y1); ctx.lineTo(it.x2, it.y2); ctx.stroke();
    if (it.k !== "line") arrowHead(it.x1, it.y1, it.x2, it.y2);
    if (it.k === "both") arrowHead(it.x2, it.y2, it.x1, it.y1);
    // An open end shows as a hollow ring, so what is unconnected is visible before it is sent.
    if (it !== cur) [[it.a, it.x1, it.y1], [it.b, it.x2, it.y2]].forEach(([id, x, y]) => { if (!id) {
      ctx.save(); ctx.lineWidth = 1.5; ctx.fillStyle = css("var(--card)"); ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); } });
  } else if (it.t === "text") {
    ctx.font = font(it); ctx.textBaseline = "top"; ctx.direction = rtl(it.s) ? "rtl" : "ltr"; ctx.textAlign = "left";
    ctx.fillText(it.s, it.x, it.y);
  }
  ctx.restore();
}
// Binding: an arrow end belongs to the shape or text the pointer was inside when it started or ended.
// The smallest shape wins; a text counts only outside every shape, since text in a shape is its name.
const byId = id => items.find(i => i.id === id);
function bindTarget(x, y) {
  const shape = items.filter(i => i.t === "shape" && i !== cur && shapeMeasure(i, x, y) <= 1)
    .sort((a, b) => { const A = bounds(a), B = bounds(b); return (A[2] - A[0]) * (A[3] - A[1]) - (B[2] - B[0]) * (B[3] - B[1]); })[0];
  if (shape) return shape;
  return items.filter(i => i.t === "text" && (() => { const [l, t, r, b] = bounds(i); return x >= l - 4 && x <= r + 4 && y >= t - 4 && y <= b + 4; })()).pop() || null;
}
// Where a bound end meets the target's outline, on the way to the other end.
function edgePoint(target, tx, ty) {
  const [l, t, r, b] = bounds(target), cx = (l + r) / 2, cy = (t + b) / 2, dx = tx - cx, dy = ty - cy;
  if (!dx && !dy) return [cx, cy];
  const m = target.t === "shape" ? shapeMeasure(target, cx + dx, cy + dy) : Math.max(Math.abs(dx) / ((r - l) / 2 + 4), Math.abs(dy) / ((b - t) / 2 + 4));
  return [cx + dx / m, cy + dy / m];
}
const centre = it => { const [l, t, r, b] = bounds(it); return [(l + r) / 2, (t + b) / 2]; };
function resolveLines() {
  items.concat(cur ? [cur] : []).filter(i => i.t === "line").forEach(it => {
    const A = it.a && byId(it.a), B = it.b && byId(it.b);
    if (it.a && !A) it.a = null; if (it.b && !B) it.b = null;
    const aim1 = B ? centre(B) : [it.x2, it.y2], aim2 = A ? centre(A) : [it.x1, it.y1];
    if (A) [it.x1, it.y1] = edgePoint(A, ...aim1);
    if (B) [it.x2, it.y2] = edgePoint(B, ...aim2);
  });
}
function draw() {
  resolveLines();
  ctx.clearRect(0, 0, cv.width, cv.height); items.forEach(drawItem); if (cur) drawItem(cur);
  if (hover && items.includes(hover)) {
    const [l, t, r, b] = bounds(hover);
    ctx.save(); ctx.strokeStyle = css("var(--ring)"); ctx.lineWidth = 3; ctx.globalAlpha = .6;
    if (hover.t === "shape") { shapePath(hover); ctx.stroke(); } else ctx.strokeRect(l - 4, t - 4, r - l + 8, b - t + 8);
    ctx.restore();
  }
  if (sel && items.includes(sel)) {
    const [l, t, r, b] = bounds(sel);
    ctx.save(); ctx.strokeStyle = css("var(--ring)"); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.strokeRect(l - 6, t - 6, r - l + 12, b - t + 12);
    ctx.setLineDash([]); ctx.fillStyle = css("var(--background)");
    handles(sel).forEach(([, hx, hy]) => { ctx.fillRect(hx - 4, hy - 4, 8, 8); ctx.strokeRect(hx - 4, hy - 4, 8, 8); });
    ctx.restore();
  }
  document.getElementById("dup").disabled = !(sel && items.includes(sel));
}
// Handles: a shape stretches from its edges and corners, a line from its two ends.
function handles(it) {
  if (it.t === "line") return [["a", it.x1, it.y1], ["b", it.x2, it.y2]];
  if (it.t !== "shape") return [];
  const [l, t, r, b] = bounds(it), cx = (l + r) / 2, cy = (t + b) / 2;
  return [["nw", l, t], ["n", cx, t], ["ne", r, t], ["e", r, cy], ["se", r, b], ["s", cx, b], ["sw", l, b], ["w", l, cy]];
}
const CURSORS = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", a: "move", b: "move" };
const handleAt = (x, y) => sel && items.includes(sel) ? (handles(sel).find(([, hx, hy]) => Math.abs(hx - x) <= 7 && Math.abs(hy - y) <= 7) || [])[0] : undefined;
function stretch(it, h, x, y) {
  if (it.t === "line") { if (h === "a") { it.x1 = x; it.y1 = y; } else { it.x2 = x; it.y2 = y; } return; }
  let [l, t, r, b] = bounds(it);
  if (h.includes("n")) t = Math.min(y, b - 8); if (h.includes("s")) b = Math.max(y, t + 8);
  if (h.includes("w")) l = Math.min(x, r - 8); if (h.includes("e")) r = Math.max(x, l + 8);
  it.x1 = l; it.y1 = t; it.x2 = r; it.y2 = b;
}
// A copy of the item, and of what lies inside it when it is a shape, a little down and aside.
function duplicate(it, dx = 16, dy = 16) {
  const before = snap(), group = [it, ...(it.t === "shape" ? contained(it) : [])];
  const copies = group.map(o => JSON.parse(JSON.stringify(o))), ids = {};
  copies.forEach(c => { ids[c.id] = newId(); c.id = ids[c.id]; });
  copies.filter(c => c.t === "line").forEach(c => { c.a = ids[c.a] || null; c.b = ids[c.b] || null; });
  items.push(...copies); copies.forEach(c => { if (c.p) c.p = c.p.map(([a, b]) => [a + dx, b + dy]); else if (c.t === "text") { c.x += dx; c.y += dy; } else { c.x1 += dx; c.x2 += dx; c.y1 += dy; c.y2 += dy; } });
  commit(before); sel = copies[0]; draw(); return copies[0];
}

const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
// Where a point sits against a shape: below 1 inside, 1 on the outline, above 1 outside.
function shapeMeasure(it, x, y) {
  const [l, t, r, b] = bounds(it), rx = (r - l) / 2 || 1, ry = (b - t) / 2 || 1, dx = (x - (l + r) / 2) / rx, dy = (y - (t + b) / 2) / ry;
  if (it.k === "ellipse") return Math.hypot(dx, dy);
  if (it.k === "diamond") return Math.abs(dx) + Math.abs(dy);
  return Math.max(Math.abs(dx), Math.abs(dy));
}
function hit(it, x, y, inside) {
  if (it.t === "shape") { const m = shapeMeasure(it, x, y), [l, t, r, b] = bounds(it), tol = 20 / Math.max(8, Math.min(r - l, b - t));
    return inside ? m <= 1 + tol : Math.abs(m - 1) <= tol; }
  const near = (ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1,
    t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l)); return Math.hypot(ax + t * dx - x, ay + t * dy - y) < 10; };
  if (it.p) return it.p.some(([a, b], k) => k && near(it.p[k - 1][0], it.p[k - 1][1], a, b));
  if (it.t === "line") return near(it.x1, it.y1, it.x2, it.y2);
  if (it.t === "text") { const [l, t, r, b] = bounds(it); return x >= l - 4 && x <= r + 4 && y >= t - 4 && y <= b + 4; }
}
// The topmost hit wins, but what sits inside a shape beats the shape itself.
const at = (x, y) => { const hits = items.filter(it => hit(it, x, y, true));
  return hits.filter(it => it.t !== "shape" || hit(it, x, y)).pop() || hits.pop(); };

cv.addEventListener("pointerdown", e => {
  closeMenus();
  const [x, y] = pos(e);
  if (tool === "text") return placeText(x, y);
  cv.setPointerCapture(e.pointerId);
  if (tool === "eraser") { drag = { erase: snap() }; erase(x, y); return; }
  if (tool === "select") {
    const h = handleAt(x, y);
    if (h) { drag = { stretch: h, it: sel, before: snap() }; return; }
    sel = at(x, y) || null;
    if (sel && e.altKey) { const before = snap(); sel = duplicate(sel, 0, 0); past.pop(); drag = { it: sel, x, y, before }; return; }
    if (sel) drag = { it: sel, x, y, before: snap() }; draw(); return;
  }
  if (tool === "pen" || tool === "marker") cur = { id: newId(), t: tool, c: color, p: [[x, y]] };
  else cur = { id: newId(), t: tool, k: tool === "shape" ? shapeKind : lineKind, c: color, x1: x, y1: y, x2: x, y2: y };
  if (tool === "line") { const target = bindTarget(x, y); cur.a = target ? target.id : null; hover = target; }
});
cv.addEventListener("dblclick", e => {
  if (tool !== "select") return;
  const [x, y] = pos(e); const it = at(x, y);
  if (it && it.t === "text") placeText(it.x, it.y, it);
});
cv.addEventListener("pointermove", e => {
  const [x, y] = pos(e);
  if (drag && drag.stretch) {
    if (drag.it.t === "line") { drag.it[drag.stretch] = null; hover = bindTarget(x, y); }
    stretch(drag.it, drag.stretch, x, y); draw(); return; }
  if (drag && drag.it) { move(drag.it, x - drag.x, y - drag.y); drag.x = x; drag.y = y; draw(); return; }
  if (!drag && tool === "select") { const h = handleAt(x, y); cv.style.cursor = h ? CURSORS[h] : ""; }
  if (drag && drag.erase !== undefined) { erase(x, y); return; }
  if (!cur) return;
  if (cur.p) cur.p.push([x, y]); else { cur.x2 = x; cur.y2 = y; }
  if (cur.t === "line") hover = bindTarget(x, y);
  draw();
});
function erase(x, y) { const k = items.findLastIndex(it => hit(it, x, y)); if (k >= 0) { items.splice(k, 1); draw(); } }
// A shape carries whatever lies wholly inside it.
function contained(it) {
  const [L, T, R, B] = bounds(it);
  return items.filter(o => { if (o === it) return false; const [l, t, r, b] = bounds(o);
    return l >= L && r <= R && t >= T && b <= B && shapeMeasure(it, (l + r) / 2, (t + b) / 2) <= 1; });
}
function move(it, dx, dy) {
  if (it.t === "line") { it.a = null; it.b = null; }
  [it, ...(it.t === "shape" ? contained(it) : [])].forEach(o => {
    if (o.p) o.p = o.p.map(([a, b]) => [a + dx, b + dy]);
    else if (o.t === "text") { o.x += dx; o.y += dy; }
    else { o.x1 += dx; o.x2 += dx; o.y1 += dy; o.y2 += dy; }
  });
}
cv.addEventListener("pointerup", () => {
  if (drag && drag.stretch && drag.it.t === "line") { drag.it[drag.stretch] = hover ? hover.id : null; hover = null; draw(); }
  if (drag) { commit(drag.it ? drag.before : drag.erase); drag = null; return; }
  if (!cur) return;
  if (cur.t === "line") { cur.b = hover && hover.id !== cur.a ? hover.id : null; hover = null; }
  const tiny = cur.p ? cur.p.length < 2 : Math.hypot(cur.x2 - cur.x1, cur.y2 - cur.y1) < 6;
  if (!tiny) { const before = snap(); items.push(cur); commit(before); }
  cur = null; draw(); if (!tiny) afterUse();
});

function placeText(x, y, editing) {
  const inp = document.createElement("input");
  inp.dir = "auto"; inp.style.left = (x - 5) + "px"; inp.style.top = (y - 4) + "px";
  if (editing) inp.value = editing.s;
  inp.style.fontSize = (editing ? editing.z || 15 : textSize) + "px";
  board.appendChild(inp); setTimeout(() => { inp.focus(); inp.select(); }, 0);
  let closed = false;
  const done = keep => {
    if (closed) return; closed = true; const s = inp.value.trim(), before = snap();
    if (editing) { if (keep && s) editing.s = s; else if (keep) items.splice(items.indexOf(editing), 1); }
    else if (keep && s) items.push({ id: newId(), t: "text", c: color, s, x, y, z: textSize });
    commit(before); inp.remove(); draw();
    // A new text stays selected, so its size and color can change right away.
    if (!editing && keep && s) { afterUse(); if (tool === "select") { sel = items[items.length - 1]; draw(); } }
  };
  inp.addEventListener("keydown", e => { if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); });
  inp.addEventListener("blur", () => done(true));
}

// A selected text changes size; with nothing selected, the size is for the next text.
function resize(step) {
  const from = sel && sel.t === "text" ? sel.z || 15 : textSize;
  const k = Math.max(0, Math.min(SIZES.length - 1, SIZES.findIndex(v => v >= from) + step));
  if (sel && sel.t === "text") { const before = snap(); sel.z = SIZES[k]; commit(before); draw(); }
  else textSize = SIZES[k];
}
document.getElementById("smaller").onclick = () => resize(-1);
document.getElementById("bigger").onclick = () => resize(1);
document.getElementById("undo").onclick = doUndo;
document.getElementById("redo").onclick = doRedo;
document.getElementById("dup").onclick = () => { if (sel && items.includes(sel)) duplicate(sel); };
document.getElementById("clear").onclick = () => { const before = snap(); items = []; sel = null; commit(before); draw(); };
syncHistory(); pick("pen");

// What the agent reads: the drawing as structure, beside the image.
function describe() {
  const shapes = items.filter(i => i.t === "shape").map(s => { const [l, t, r, d] = bounds(s); return { s, l, t, r, d, texts: [] }; });
  const area = n => (n.r - n.l) * (n.d - n.t);
  const owner = (x, y) => shapes.filter(n => shapeMeasure(n.s, x, y) <= 1.05).sort((a, b) => area(a) - area(b))[0];
  const loose = [];
  items.filter(i => i.t === "text").forEach(t => { const [l, tp, r, b] = bounds(t), o = owner((l + r) / 2, (tp + b) / 2); o ? o.texts.push(t) : loose.push(t); });
  shapes.forEach((n, k) => { n.name = n.texts.sort((a, b) => a.y - b.y).map(t => t.s).join(" / ") || SHAPES[n.s.k] + " " + (k + 1);
    n.parent = shapes.filter(o => o !== n && contained(o.s).includes(n.s)).sort((a, b) => area(a) - area(b))[0]; });
  const tag = (kind, c) => " (" + [kind, c ? NAMES[c] : null].filter(Boolean).join(", ") + ")";
  const weight = t => (t.z || 15) > 15 ? " (large, " + t.z + ")" : (t.z || 15) < 15 ? " (small, " + t.z + ")" : "";
  const lines = [];
  const tree = (p, depth) => shapes.filter(n => n.parent === p).sort((a, b) => a.t - b.t || a.l - b.l)
    .forEach(n => { lines.push("  ".repeat(depth) + "- [" + n.name + "]" + tag(SHAPES[n.s.k], n.s.c)); tree(n, depth + 1); });
  if (shapes.length) { lines.push("Shapes (nesting = a shape inside a shape):"); tree(undefined, 1); }
  const links = items.filter(i => i.t === "line");
  const sym = { arrow: " → ", line: " — ", both: " ↔ " };
  // Each end is what it was bound to on the board, never a guess from distance.
  const end = id => { const o = id && byId(id); if (!o) return "(open end)";
    return o.t === "shape" ? "[" + shapes.find(n => n.s === o).name + "]" : "\"" + o.s + "\""; };
  if (links.length) { lines.push("Connections (arrows and lines, from → to):"); links.forEach(a =>
    lines.push("  - " + end(a.a) + sym[a.k] + end(a.b) + (a.c ? " (" + NAMES[a.c] + ")" : ""))); }
  if (loose.length) { lines.push("Free text (top to bottom):"); loose.sort((a, b) => a.y - b.y).forEach(t => lines.push("  - " + t.s + weight(t) + (t.c ? " (" + NAMES[t.c] + ")" : ""))); }
  const marks = items.filter(i => i.t === "marker");
  if (marks.length) { lines.push("Marker highlights:"); marks.forEach(m => { const [l, t, r, d] = bounds(m), cx = (l + r) / 2, cy = (t + d) / 2;
    const near = items.filter(i => i.t === "text").filter(t => Math.abs(t.y + 8 - cy) < 22 && Math.abs(t.x + textWidth(t) / 2 - cx) < 260).map(t => t.s);
    const o = owner(cx, cy); lines.push("  - " + NAMES[m.c] + (near.length ? " on: " + near.join(", ") : o ? " inside [" + o.name + "]" : " on an area without text")); }); }
  // Same color, listed together: a color may mean a relation, a level, a concept or emphasis.
  const named = it => it.t === "text" ? it.s : it.t === "shape" ? shapes.find(n => n.s === it).name : null;
  const byColor = {};
  items.forEach(it => { const n = named(it); if (it.c && n) (byColor[NAMES[it.c]] ||= []).push(n); });
  const groups = Object.entries(byColor).filter(([, v]) => v.length > 1);
  if (groups.length) { lines.push("By color:"); groups.forEach(([c, v]) => lines.push("  - " + c + ": " + v.join(", "))); }
  const pens = items.filter(i => i.t === "pen").length;
  if (pens) lines.push("Freehand pen strokes: " + pens + " (in the image)");
  return lines.join("\n") || "(the board is empty)";
}
document.getElementById("send").onclick = () => {
  const out = document.getElementById("out"); out.style.display = "block";
  out.textContent = "What goes to the conversation, beside the image:\n\n" + describe();
  window.parent.postMessage({ jsonrpc: "2.0", method: "ui/notifications/size-changed", params: { height: document.documentElement.scrollHeight } }, "*");
};

})();
