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

// the enlarged view: a second copy of the board on the same storage; what is drawn there appears on the first when it saves
const ctx2 = await browser.newContext({ viewport: { width: 728, height: 620 } })
await ctx2.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
const inline = await ctx2.newPage(); await inline.goto('file://' + page); await inline.evaluate(() => localStorage.clear()); await inline.reload()
const big = await ctx2.newPage(); await big.goto('file://' + page)
const bb = await big.locator('#c').boundingBox()
await big.click('[data-tool="shape"]')
await big.mouse.move(bb.x + 300, bb.y + 200); await big.mouse.down(); await big.mouse.move(bb.x + 450, bb.y + 320, { steps: 4 }); await big.mouse.up()
await inline.waitForTimeout(200)
await inline.click('#send')
check('the drawing made in the enlarged copy shows up on the first copy', !(await inline.locator('#out').innerText()).includes('(the board is empty)'))
await big.click('#send'); await big.waitForTimeout(300)
check('Send says the text was copied', (await big.locator('#out').innerText()).includes('Copied'))

await browser.close()
process.exit(red ? 1 : 0)
