import studies from './studies.json'
import s01 from '../01-concept.png?url'
import s02 from '../02-concept.png?url'
import s03 from '../03-concept.png?url'
import s04 from '../04-concept.png?url'
import s05 from '../05-concept.png?url'
import s06 from '../06-concept.png?url'
import s07 from '../07-concept.png?url'
import s08 from '../08-concept.png?url'
import s09 from '../09-concept.png?url'
import s10 from '../10-concept.png?url'
import s11 from '../11-concept.png?url'
import s12 from '../12-concept.png?url'
import s13 from '../13-concept.png?url'

// URL imports only. The PNG files at the repository root are not rewritten.
const byFile = {
  '01-concept.png': s01,
  '02-concept.png': s02,
  '03-concept.png': s03,
  '04-concept.png': s04,
  '05-concept.png': s05,
  '06-concept.png': s06,
  '07-concept.png': s07,
  '08-concept.png': s08,
  '09-concept.png': s09,
  '10-concept.png': s10,
  '11-concept.png': s11,
  '12-concept.png': s12,
  '13-concept.png': s13,
}

const missing = studies.filter((study) => !byFile[study.file])
const listed = new Set(studies.map((study) => study.file))
const extra = Object.keys(byFile).filter((file) => !listed.has(file))
if (missing.length || extra.length) {
  throw new Error(
    `Study catalog and image imports diverged. Missing imports: ${
      missing.map((study) => study.file).join(', ') || 'none'
    }. Extra imports: ${extra.join(', ') || 'none'}.`,
  )
}

export const studiesCatalog = studies.map((study) =>
  Object.freeze({
    ...study,
    tags: Object.freeze([...study.tags]),
    src: byFile[study.file],
  }),
)

export const byId = new Map(studiesCatalog.map((study) => [study.id, study]))
