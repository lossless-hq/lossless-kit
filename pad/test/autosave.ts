// A drawing survives a reload of the board's frame, and Clear really empties it. Run: bun pad/test/autosave.ts (needs Chrome).
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const here = new URL('.', import.meta.url).pathname
const board = here + '../board.js'
const page = join(tmpdir(), 'pad-autosave.html')
writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>
<script>window.PREFS = { lock: false, shape: "rect", line: "arrow" };</script><script src="file://${board}"></script></body></html>`)
const browser = await chromium.launch({ channel: 'chrome' })
const p = await browser.newPage({ viewport: { width: 728, height: 620 } })
await p.goto('file://' + page)
await p.evaluate(() => localStorage.clear())
await p.reload()
const printed = async () => { await p.click('#send'); return p.locator('#out').innerText() }
let red = 0
const check = (name: string, ok: boolean) => { if (!ok) red++; console.log(`${ok ? 'green' : 'RED  '} ${name}`) }

check('a new board is empty', (await printed()).includes('(the board is empty)'))

const box = await p.locator('#c').boundingBox()
await p.click('[data-tool="shape"]')
await p.mouse.move(box.x + 300, box.y + 200); await p.mouse.down(); await p.mouse.move(box.x + 450, box.y + 320, { steps: 4 }); await p.mouse.up()
check('the drawing is on the board', !(await printed()).includes('(the board is empty)'))

await p.reload()
check('the drawing is still there after a reload of the frame', !(await printed()).includes('(the board is empty)'))

await p.click('#clear')
await p.reload()
check('Clear empties the saved drawing too', (await printed()).includes('(the board is empty)'))

await browser.close()
process.exit(red ? 1 : 0)
