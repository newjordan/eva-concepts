import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  columnCountFromTops,
  filterStudies,
  moveGridIndex,
  neighborId,
  resolveRoute,
} from '../src/logic.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const studies = JSON.parse(readFileSync(join(root, 'src/studies.json'), 'utf8'))

assert.deepEqual(resolveRoute('', studies), { name: 'gallery' })
assert.deepEqual(resolveRoute('#/', studies), { name: 'gallery' })
assert.deepEqual(resolveRoute('#/08', studies), { name: 'study', id: '08' })
assert.deepEqual(resolveRoute('#/99', studies), { name: 'missing', id: '99' })
assert.equal(resolveRoute('#/01/extra', studies).name, 'missing')

const tactical = filterStudies(studies, 'Tactical').map((study) => study.id)
assert.deepEqual(tactical, ['08', '09'])
assert.deepEqual(filterStudies(studies, 'entry plug').map((study) => study.id), ['10'])
assert.deepEqual(filterStudies(studies, '68.4').map((study) => study.id), ['09'])
assert.deepEqual(filterStudies(studies, 'playful').map((study) => study.id), ['12'])
assert.deepEqual(filterStudies(studies, 'intercomputer').map((study) => study.id), ['13'])
assert.deepEqual(filterStudies(studies, 'zzzz-nope'), [])
assert.equal(filterStudies(studies, '   ').length, studies.length)
assert.notEqual(filterStudies(studies, ''), studies, 'unfiltered result should be a copy')

assert.equal(neighborId(studies, '01', -1), '13')
assert.equal(neighborId(studies, '13', 1), '01')
assert.equal(neighborId(studies, '07', 1), '08')

assert.equal(moveGridIndex(0, 13, 3, 'right'), 1)
assert.equal(moveGridIndex(2, 13, 3, 'right'), 3)
assert.equal(moveGridIndex(0, 13, 3, 'left'), 0)
assert.equal(moveGridIndex(0, 13, 3, 'down'), 3)
assert.equal(moveGridIndex(4, 13, 3, 'up'), 1)
assert.equal(moveGridIndex(12, 13, 3, 'down'), 12)
assert.equal(moveGridIndex(5, 13, 1, 'down'), 6)
assert.equal(moveGridIndex(9, 13, 3, 'home'), 0)
assert.equal(moveGridIndex(2, 13, 3, 'end'), 12)

assert.equal(columnCountFromTops([10, 10.4, 11, 40]), 3)
assert.equal(columnCountFromTops([10, 40, 70]), 1)
assert.equal(columnCountFromTops([]), 1)

console.log('logic ok')
