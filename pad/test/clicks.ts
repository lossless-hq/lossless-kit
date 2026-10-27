// The pad board under a real mouse, at a person's pace: one click is one thing, nothing on the board is marked as page
// text, and a text opens for editing only when asked, caret at its end. Run: bun pad/test/clicks.ts (needs Chrome).
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const here = new URL('.', import.meta.url).pathname
const board = here + '../board.js'
const page = join(tmpdir(), 'pad-clicks.html')
writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>
<script>window.PREFS = { lock: false, shape: "rect", line: "arrow" };</script><script src="file://${board}"></script></body></html>`)
const browser = await chromium.launch({ channel: 'chrome' })
let red = 0
async function scenario(name: string, steps: (p: any, c: { x: number; y: number }) => Promise<void>, expect: { selection?: boolean; inputs?: number; value?: string; selected?: number; sends?: string }) {
  const p = await browser.newPage({ viewport: { width: 728, height: 620 } })
  await p.goto('file://' + page)
  const box = await p.locator('#c').boundingBox()
  await steps(p, { x: box.x, y: box.y })
  await p.waitForTimeout(50)
  const sel = await p.evaluate(() => String(getSelection()).trim())
  const inputs = await p.locator('#board input').count()
  const box1 = inputs ? await p.evaluate(() => { const i = document.querySelector('#board input') as HTMLInputElement; return { value: i.value, selected: i.selectionEnd - i.selectionStart } }) : null
  let sent = ''
  if (expect.sends !== undefined) { await p.keyboard.press('Escape'); await p.click('#send'); sent = await p.locator('#out').innerText() }
  const bad = (expect.selection === false && sel !== '') || (expect.inputs !== undefined && inputs !== expect.inputs) ||
    (expect.value !== undefined && box1?.value !== expect.value) || (expect.selected !== undefined && box1?.selected !== expect.selected) ||
    (expect.sends !== undefined && !sent.includes(expect.sends))
  if (bad) red++
  console.log(`${bad ? 'RED  ' : 'green'} ${name}: selection=${JSON.stringify(sel.slice(0, 40))} inputs=${inputs}${box1 ? ` value=${JSON.stringify(box1.value)} marked=${box1.selected}` : ''}`)
  await p.close()
}
const tool = (p: any, t: string) => p.click(`[data-tool="${t}"]`)
const write = async (p: any, c: any, x: number, y: number, s: string) => { await tool(p, 'text'); await p.mouse.click(c.x + x, c.y + y); await p.waitForTimeout(150); await p.keyboard.type(s, { delay: 40 }); await p.keyboard.press('Enter') }

await scenario('one click on a tool button', async (p) => { await tool(p, 'pen') }, { selection: false })
const dbl = async (p: any, sel: string) => { const b = await p.locator(sel).boundingBox(); await p.mouse.dblclick(b.x + b.width / 2, b.y + b.height / 2) }
const rect = async (p: any, c: any) => { await tool(p, 'shape'); await p.mouse.move(c.x+300,c.y+200); await p.mouse.down(); await p.mouse.move(c.x+450,c.y+320,{steps:4}); await p.mouse.up() }
// One click is one thing; nothing on the board's chrome is ever marked as page text.
await scenario('two quick clicks on a tool button', async (p) => { await dbl(p, '[data-tool="pen"]') }, { selection: false })
await scenario('two quick clicks on Bigger', async (p) => { await dbl(p, '#bigger') }, { selection: false })
await scenario('two quick clicks on the canvas, pen', async (p) => { await tool(p, 'pen'); await dbl(p, '#c') }, { selection: false })
await scenario('select tool: two quick clicks on a box', async (p, c) => { await rect(p, c); await tool(p, 'select'); await p.mouse.dblclick(c.x + 375, c.y + 200) }, { selection: false, inputs: 0 })
await scenario('after writing a text, one click elsewhere', async (p, c) => { await write(p, c, 400, 300, 'hello'); await p.mouse.click(c.x + 500, c.y + 450) }, { inputs: 0 })
await scenario('after writing a text, one click on it', async (p, c) => { await write(p, c, 400, 300, 'hello'); await p.mouse.click(c.x + 410, c.y + 305) }, { inputs: 0 })
await scenario('Shape: one click after drawing, to select it', async (p, c) => { await rect(p, c); await p.mouse.click(c.x + 375, c.y + 200) }, { inputs: 0 })
// Editing an existing text opens it with the caret at its end, nothing marked, never a new box on top.
await scenario('select tool: two quick clicks on a text edit it, nothing marked', async (p, c) => { await write(p, c, 400, 300, 'hello'); await tool(p, 'select'); await p.mouse.dblclick(c.x + 410, c.y + 305) }, { inputs: 1, value: 'hello', selected: 0, selection: false })
await scenario('Text tool: one click on an existing text edits it', async (p, c) => { await write(p, c, 400, 300, 'hello'); await tool(p, 'text'); await p.mouse.click(c.x + 410, c.y + 305) }, { inputs: 1, value: 'hello', selected: 0 })
await scenario('lock on: one click on a text inside a box edits it', async (p, c) => { await p.click('#lock'); await rect(p, c); await write(p, c, 320, 230, 'in box'); await p.mouse.click(c.x + 330, c.y + 235) }, { inputs: 1, value: 'in box', selected: 0 })
// Typing straight after the click goes into the text, not to the shortcuts.
await scenario('Text: type right after the click', async (p, c) => { await tool(p, 'text'); await p.mouse.click(c.x + 400, c.y + 300); await p.keyboard.type('hello'); await p.keyboard.press('Enter') }, { inputs: 0, sends: 'hello' })
await browser.close()
console.log(red ? `${red} red` : 'all green')
process.exit(red ? 1 : 0)
