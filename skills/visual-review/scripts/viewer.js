// The review viewer: pages of someone's work (slides, PDF pages, images) shown inside an agent conversation, to mark.
// A page loads it with one script tag, after setting window.REVIEW = { title, pages: [{ src, name }] }.
(() => {
const REVIEW = Object.assign({ title: "", pages: [] }, window.REVIEW);
const style = document.createElement("style");
style.textContent = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 8px; font-family: var(--font-sans, system-ui, sans-serif); color: var(--foreground, #222); }
  .bar { position: sticky; top: 0; z-index: 5; display: flex; gap: 8px; align-items: center; padding: 8px 0;
    background: var(--background, #fff); }
  .bar .title { flex: 1; font-weight: 600; }
  .bar .count { font-size: 12px; color: var(--muted-foreground, #666); }
  button { font: inherit; font-size: 13px; height: 30px; padding: 0 12px; border-radius: calc(var(--radius, 8px) - 2px);
    border: 1px solid var(--border, #ccc); background: var(--secondary, #eee); color: var(--secondary-foreground, #222); cursor: pointer; }
  button.primary { background: var(--primary, #222); color: var(--primary-foreground, #fff); border-color: var(--primary, #222); }
  figure { margin: 0 auto 18px; max-width: 960px; }
  figcaption { font-size: 12px; color: var(--muted-foreground, #666); margin-bottom: 4px; }
  .page { position: relative; border: 1px solid var(--border, #ccc); line-height: 0; cursor: crosshair; touch-action: none;
    -webkit-user-select: none; user-select: none; }
  .page img { width: 100%; display: block; pointer-events: none; }
  .mark { position: absolute; border: 2px solid var(--destructive, #d33); background: rgb(220 50 50 / .12); line-height: 1.3; }
  .mark.draft { border-style: dashed; }
  .mark b { position: absolute; top: -11px; inset-inline-start: -11px; min-width: 22px; height: 22px; padding: 0 5px;
    border-radius: 11px; background: var(--destructive, #d33); color: #fff; font-size: 12px; text-align: center; line-height: 22px; }
  .note { position: absolute; z-index: 3; display: flex; gap: 4px; line-height: 1.3; }
  .note input { font: 14px var(--font-sans, system-ui, sans-serif); min-width: 240px; padding: 3px 6px;
    border: 1px solid var(--ring, #888); border-radius: 4px; background: var(--popover, #fff); color: var(--foreground, #222);
    -webkit-user-select: text; user-select: text; }
  .list { max-width: 960px; margin: 0 auto; font-size: 13px; }
  .list div { display: flex; gap: 8px; align-items: baseline; padding: 3px 0; border-bottom: 1px solid var(--border, #ddd); }
  .list .del { margin-inline-start: auto; height: 22px; padding: 0 8px; font-size: 12px; }
  pre { max-width: 960px; margin: 10px auto 0; font: 12px/1.5 var(--font-mono, monospace); padding: 12px 16px;
    background: var(--code-background, #f4f4f4); border-radius: var(--radius, 8px); white-space: pre-wrap; display: none; }
  .hint { max-width: 960px; margin: 6px auto 0; font-size: 12px; color: var(--muted-foreground, #666); }
`;
document.head.appendChild(style);
document.body.insertAdjacentHTML("afterbegin", `
<div class="bar"><span class="title"></span><span class="count" id="count"></span>
  <button id="undo">Undo</button><button id="send" class="primary">Send</button></div>
<div id="pages"></div>
<div class="list" id="list"></div>
<pre id="out"></pre>
<div class="hint">Drag on a page to mark a region, type what is wrong or unclear, Enter to keep it. Send gives the marks to the conversation.</div>
`);
document.querySelector(".bar .title").textContent = REVIEW.title;

const marks = []; // { page (1-based), x, y, w, h (fractions of the page), text }
const pagesEl = document.getElementById("pages");
const where = m => (m.y + m.h / 2 < 1 / 3 ? "top" : m.y + m.h / 2 > 2 / 3 ? "bottom" : "middle") + " " +
  (m.x + m.w / 2 < 1 / 3 ? "left" : m.x + m.w / 2 > 2 / 3 ? "right" : "centre");
const pct = v => Math.round(v * 100) + "%";

REVIEW.pages.forEach((p, i) => {
  const fig = document.createElement("figure");
  fig.innerHTML = `<figcaption></figcaption><div class="page"><img alt=""></div>`;
  fig.querySelector("figcaption").textContent = (i + 1) + (p.name ? " · " + p.name : "");
  const page = fig.querySelector(".page"); fig.querySelector("img").src = p.src;
  pagesEl.appendChild(fig);
  let drag = null;
  const rel = e => { const r = page.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  const box = (el, m) => { el.style.left = m.x * 100 + "%"; el.style.top = m.y * 100 + "%"; el.style.width = m.w * 100 + "%"; el.style.height = m.h * 100 + "%"; };
  page.addEventListener("pointerdown", e => {
    if (e.target.closest(".note")) return;
    page.setPointerCapture(e.pointerId);
    const [x, y] = rel(e); const el = document.createElement("div"); el.className = "mark draft"; page.appendChild(el);
    drag = { x0: x, y0: y, el, m: { x, y, w: 0, h: 0 } }; box(el, drag.m);
  });
  page.addEventListener("pointermove", e => {
    if (!drag) return; const [x, y] = rel(e);
    drag.m = { x: Math.max(0, Math.min(drag.x0, x)), y: Math.max(0, Math.min(drag.y0, y)),
      w: Math.min(1, Math.abs(x - drag.x0)), h: Math.min(1, Math.abs(y - drag.y0)) };
    box(drag.el, drag.m);
  });
  page.addEventListener("pointerup", () => {
    if (!drag) return; const { el, m } = drag; drag = null;
    if (m.w < 0.02 || m.h < 0.02) { el.remove(); return; }
    const wrap = document.createElement("div"); wrap.className = "note";
    wrap.style.left = Math.min(m.x, 0.6) * 100 + "%"; wrap.style.top = Math.min(1, m.y + m.h) * 100 + "%";
    wrap.innerHTML = `<input dir="auto" placeholder="what is unclear here?">`; page.appendChild(wrap);
    const inp = wrap.querySelector("input"); inp.focus();
    let closed = false;
    const done = keep => {
      if (closed) return; closed = true; wrap.remove(); el.remove();
      const text = inp.value.trim(); if (keep && text) { marks.push({ page: i + 1, ...m, text }); render(); }
    };
    inp.addEventListener("keydown", e => { if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); });
    inp.addEventListener("blur", () => done(true));
  });
});

// Marks are redrawn from the list, numbered in the order they were made.
function render() {
  document.querySelectorAll(".mark:not(.draft)").forEach(n => n.remove());
  const figs = pagesEl.querySelectorAll(".page");
  marks.forEach((m, k) => {
    const el = document.createElement("div"); el.className = "mark";
    el.style.left = m.x * 100 + "%"; el.style.top = m.y * 100 + "%"; el.style.width = m.w * 100 + "%"; el.style.height = m.h * 100 + "%";
    el.innerHTML = "<b>" + (k + 1) + "</b>"; figs[m.page - 1].appendChild(el);
  });
  const list = document.getElementById("list"); list.innerHTML = "";
  marks.forEach((m, k) => {
    const row = document.createElement("div"); row.dir = "auto";
    row.innerHTML = "<b>" + (k + 1) + "</b><span></span><button class='del'>Remove</button>";
    row.querySelector("span").textContent = "Page " + m.page + ", " + where(m) + ": " + m.text;
    row.querySelector("button").onclick = () => { marks.splice(k, 1); render(); };
    list.appendChild(row);
  });
  document.getElementById("count").textContent = marks.length ? marks.length + " marks" : "";
  document.getElementById("undo").disabled = !marks.length;
}
document.getElementById("undo").onclick = () => { marks.pop(); render(); };
render();

// What the agent reads: each mark as page, place on the page, and the person's words.
function describe() {
  if (!marks.length) return "(no marks)";
  const lines = ["Marks, by page (place is on the page; x and y are percent from its top left):"];
  marks.forEach((m, k) => lines.push("  " + (k + 1) + ". Page " + m.page + ", " + where(m) + " (x " + pct(m.x) + "–" + pct(m.x + m.w) +
    ", y " + pct(m.y) + "–" + pct(m.y + m.h) + "): " + m.text));
  return lines.join("\n");
}
document.getElementById("send").onclick = () => {
  const out = document.getElementById("out"); out.style.display = "block";
  out.textContent = "What goes to the conversation:\n\n" + describe();
  window.parent.postMessage({ jsonrpc: "2.0", method: "ui/notifications/size-changed", params: { height: document.documentElement.scrollHeight } }, "*");
  // To the conversation as the person's message, where the host takes it (MCP Apps' ui/message); else it stays printed.
  window.parent.postMessage({ jsonrpc: "2.0", id: "review-send-" + Date.now(), method: "ui/message",
    params: { role: "user", content: [{ type: "text", text: "From the review viewer:\n\n" + describe() }] } }, "*");
};
})();
