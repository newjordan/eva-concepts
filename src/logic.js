export function resolveRoute(hash, studies) {
  const raw = String(hash ?? '').replace(/^#/, '')
  if (raw === '' || raw === '/') return { name: 'gallery' }
  const match = /^\/([^/]+)$/.exec(raw)
  if (!match) return { name: 'missing', id: raw.replace(/^\//, '') || raw }
  let id = match[1]
  try {
    id = decodeURIComponent(id)
  } catch {
    // Keep the raw segment when the hash is not valid encoding.
  }
  if (studies.some((study) => study.id === id)) return { name: 'study', id }
  return { name: 'missing', id }
}

export function filterStudies(studies, query) {
  const terms = String(query ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (!terms.length) return studies.slice()
  return studies.filter((study) => {
    const haystack = [
      study.id,
      study.title,
      study.summary,
      study.description,
      study.file,
      ...(study.tags ?? []),
    ]
      .join('\n')
      .toLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}

export function neighborId(studies, id, delta) {
  if (!studies.length) return null
  const index = studies.findIndex((study) => study.id === id)
  const start = index < 0 ? 0 : index
  const wrapped = (start + delta) % studies.length
  const next = wrapped < 0 ? wrapped + studies.length : wrapped
  return studies[next].id
}

export function moveGridIndex(index, count, columns, direction) {
  if (count <= 0) return 0
  const cols = Math.max(1, columns | 0)
  const current = Math.min(Math.max(index, 0), count - 1)
  if (direction === 'left') return Math.max(0, current - 1)
  if (direction === 'right') return Math.min(count - 1, current + 1)
  if (direction === 'up') return current - cols >= 0 ? current - cols : current
  if (direction === 'down') return current + cols <= count - 1 ? current + cols : current
  if (direction === 'home') return 0
  if (direction === 'end') return count - 1
  return current
}

export function columnCountFromTops(tops, tolerance = 8) {
  if (!tops?.length) return 1
  const first = tops[0]
  let columns = 0
  for (const top of tops) {
    if (Math.abs(top - first) <= tolerance) columns += 1
    else break
  }
  return Math.max(1, columns)
}
