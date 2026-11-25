import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const studies = JSON.parse(readFileSync(join(root, 'src/studies.json'), 'utf8'))

const original = [
  ['01', 'Classic dashboard', 'Hex panels, glow, scan lines, MAGI'],
  ['02', 'Grid layout', 'Radar, chamfered rects, MAGI badges'],
  ['03', 'Blueprint', 'Full-body wireframe, PCB traces, subtle glow'],
  ['04', 'Orange alert', 'Hex MAGI cluster, bar charts, 警報'],
  ['05', 'Clean & polished', 'Big titles, MAGI list, isometric'],
  ['06', 'Frosted merged panels', 'Smooth-min hex edges'],
  ['07', 'MAGI status cards', 'Horizontal, kanji labels'],
  ['08', 'Green tactical', '3 Eva units, military vibe'],
  ['09', 'Multi-unit tactical', 'Synchro 68.4%, orange/green'],
  ['10', 'Entry plug biometrics', 'Wireframe head, all-cyan'],
  ['11', 'Full-body vitals', '緊急 WARNING, pulse waves'],
  ['12', 'MAGI components', 'Multicolor on black (playful)'],
  ['13', 'MAGI intercomputer', 'Flat components, merged borders'],
]

assert.equal(studies.length, original.length, 'catalog should list every original study')

const tagPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ids = studies.map((study) => study.id)
assert.deepEqual(ids, original.map(([id]) => id), 'study ids should stay 01 through 13 in order')

for (const [index, study] of studies.entries()) {
  const [id, title, summary] = original[index]
  assert.equal(study.id, id)
  assert.equal(study.title, title, `${id} title drifted from the original index`)
  assert.equal(study.summary, summary, `${id} summary drifted from the original index`)
  assert.equal(study.file, `${id}-concept.png`)
  assert.equal(typeof study.description, 'string')
  assert.ok(study.description.length >= 40, `${id} description is too short`)
  assert.ok(Array.isArray(study.tags) && study.tags.length > 0, `${id} needs tags`)
  assert.equal(new Set(study.tags).size, study.tags.length, `${id} has duplicate tags`)
  for (const tag of study.tags) assert.match(tag, tagPattern, `${id} tag ${tag}`)
  assert.equal(study.width, 600)
  assert.equal(study.height, 400)

  const bytes = readFileSync(join(root, study.file))
  assert.ok(bytes.length > 10_000, `${study.file} looks empty`)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${study.file} is not a PNG`)
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR')
  assert.equal(bytes.readUInt32BE(16), study.width, `${study.file} width`)
  assert.equal(bytes.readUInt32BE(20), study.height, `${study.file} height`)
  assert.equal(bytes[24], 8, `${study.file} bit depth`)
  assert.ok(bytes[25] === 2 || bytes[25] === 6, `${study.file} color type`)
}

const onDisk = readdirSync(root)
  .filter((name) => /^\d+-concept\.png$/.test(name))
  .sort()
const listed = studies.map((study) => study.file).sort()
assert.deepEqual(onDisk, listed, 'every root concept PNG must be in the catalog, and nothing else')

console.log(`catalog ok: ${studies.length} original studies`)
