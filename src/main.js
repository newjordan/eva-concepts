import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/outfit/latin-400.css'
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import './styles.css'
import { byId, studiesCatalog as studies } from './catalog.js'
import {
  columnCountFromTops,
  filterStudies,
  moveGridIndex,
  neighborId,
  resolveRoute,
} from './logic.js'

const outlet = document.querySelector('#outlet')
const search = document.querySelector('#search')
const hint = document.querySelector('#hint')
const live = document.querySelector('#live')
const helpButton = document.querySelector('#help-btn')
const dialog = document.querySelector('#help-dialog')
const repoFile = 'https://github.com/newjordan/eva-concepts/blob/main/'

const state = {
  query: '',
  fit: 'fit',
  returnFocusId: null,
  focusSearch: false,
}

let lastRouteName = null
let lastRouteKey = null

function routeKey(route) {
  return route.name === 'study' ? `study:${route.id}` : route.name
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

function announce(message) {
  live.textContent = ''
  requestAnimationFrame(() => {
    live.textContent = message
  })
}

function isTyping(target) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

function visibleStudies() {
  return filterStudies(studies, state.query)
}

function countLabel(count) {
  const noun = count === 1 ? 'match' : 'matches'
  if (state.query.trim()) return `${count} ${noun}`
  return count === 1 ? '1 study' : `${count} studies`
}

function titleFor(route) {
  if (route.name === 'study') {
    const study = byId.get(route.id)
    return `${study.id} ${study.title} — Eva Concepts`
  }
  if (route.name === 'missing') return `No study ${route.id} — Eva Concepts`
  return 'Eva Concepts — Operator console studies'
}

function hintFor(route) {
  if (route.name === 'study') {
    return 'Left and right change study. Escape returns. F toggles actual size.'
  }
  return 'Arrow keys move between studies. Enter opens. Slash filters.'
}

function cardMarkup(study) {
  const label = `${study.id} ${study.title}. ${study.summary}`
  return `<li>
    <a class="card" href="#/${escapeHtml(study.id)}" data-card data-id="${escapeHtml(study.id)}" aria-label="${escapeHtml(label)}">
      <span class="card-media">
        <img src="${escapeHtml(study.src)}" alt="" width="${study.width}" height="${study.height}" decoding="async" />
        <span class="card-index" aria-hidden="true">${escapeHtml(study.id)}</span>
      </span>
      <span class="card-body">
        <h2>${escapeHtml(study.title)}</h2>
        <p>${escapeHtml(study.summary)}</p>
      </span>
    </a>
  </li>`
}

function galleryMarkup(list) {
  const cards = list.length
    ? `<ul class="grid">${list.map(cardMarkup).join('')}</ul>`
    : `<div class="empty">
        <p>No study matches “${escapeHtml(state.query.trim())}”.</p>
        <button type="button" class="text-btn" data-clear>Clear filter</button>
      </div>`
  return `<div class="intro">
      <div>
        <h1>Studies</h1>
        <p class="lede">Thirteen operator-console frames. Open a card to view the original PNG at full size.</p>
      </div>
      <p class="count">${escapeHtml(countLabel(list.length))}</p>
    </div>
    ${cards}`
}

function tagsMarkup(study) {
  return study.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')
}

function stripMarkup(currentId) {
  const items = studies
    .map((study) => {
      const current = study.id === currentId ? ' aria-current="page"' : ''
      return `<li>
        <a class="strip" href="#/${escapeHtml(study.id)}" aria-label="${escapeHtml(`${study.id} ${study.title}`)}"${current}>
          <img src="${escapeHtml(study.src)}" alt="" width="${study.width}" height="${study.height}" decoding="async" />
        </a>
      </li>`
    })
    .join('')
  return `<h2 class="strip-label">All studies</h2><ul class="strip-row">${items}</ul>`
}

function studyMarkup(study) {
  const index = studies.findIndex((item) => item.id === study.id) + 1
  const fit = state.fit === 'actual' ? 'actual' : 'fit'
  return `<div class="toolbar">
      <a class="text-btn" href="#/">All studies</a>
      <p class="position">${escapeHtml(study.id)} / ${String(studies.length).padStart(2, '0')}</p>
      <div class="toolbar-actions">
        <button type="button" class="text-btn" data-nav="-1">Prev</button>
        <button type="button" class="text-btn" data-nav="1">Next</button>
        <div class="segment" role="group" aria-label="Image scale">
          <button type="button" data-fit="fit" aria-pressed="${fit === 'fit'}">Fit</button>
          <button type="button" data-fit="actual" aria-pressed="${fit === 'actual'}">1:1</button>
        </div>
      </div>
    </div>
    <figure class="stage" data-fit="${fit}">
      <img src="${escapeHtml(study.src)}" alt="${escapeHtml(`${study.title}. ${study.description}`)}" width="${study.width}" height="${study.height}" data-fit="${fit}" decoding="async" />
      <figcaption class="sr-only">${escapeHtml(study.summary)}</figcaption>
    </figure>
    <div class="copy">
      <p class="kicker">Study ${escapeHtml(String(index))} of ${studies.length} · ${escapeHtml(study.file)} · ${study.width}×${study.height}</p>
      <h1>${escapeHtml(study.title)}</h1>
      <p class="summary">${escapeHtml(study.summary)}</p>
      <p class="description">${escapeHtml(study.description)}</p>
      <ul class="tags">${tagsMarkup(study)}</ul>
      <p><a class="text-link" href="${repoFile}${encodeURIComponent(study.file)}" target="_blank" rel="noopener noreferrer">Original file in the repository</a></p>
    </div>
    ${stripMarkup(study.id)}`
}

function missingMarkup(id) {
  return `<div class="empty">
      <h1>No study ${escapeHtml(id)}</h1>
      <p>The archive is numbered 01 through ${escapeHtml(studies[studies.length - 1].id)}.</p>
      <a class="text-btn" href="#/">Back to studies</a>
    </div>`
}

function scrollStrip() {
  const current = outlet.querySelector('.strip[aria-current="page"]')
  const row = outlet.querySelector('.strip-row')
  if (!current || !row) return
  const target = current.closest('li') || current
  const left = target.offsetLeft - row.clientWidth / 2 + target.clientWidth / 2
  row.scrollTo({ left: Math.max(0, left), behavior: 'auto' })
}

function render(options = {}) {
  const route = resolveRoute(location.hash, studies)
  document.body.dataset.route = route.name
  document.title = titleFor(route)
  if (search.value !== state.query) search.value = state.query

  if (route.name === 'study') {
    state.returnFocusId = route.id
    outlet.innerHTML = studyMarkup(byId.get(route.id))
    scrollStrip()
  } else if (route.name === 'missing') {
    outlet.innerHTML = missingMarkup(route.id)
  } else {
    outlet.innerHTML = galleryMarkup(visibleStudies())
  }

  hint.textContent = hintFor(route)

  const key = routeKey(route)
  if (lastRouteKey !== null && key !== lastRouteKey && route.name !== 'gallery') {
    window.scrollTo(0, 0)
  }
  lastRouteKey = key

  const enteredStudy = route.name === 'study' && lastRouteName !== 'study'
  const returnedToGallery = route.name === 'gallery' && lastRouteName === 'study'
  lastRouteName = route.name

  if (enteredStudy) {
    outlet.querySelector('h1')?.setAttribute('tabindex', '-1')
    outlet.querySelector('h1')?.focus({ preventScroll: true })
  }

  if (returnedToGallery) {
    const card = state.returnFocusId
      ? outlet.querySelector(`[data-id="${CSS.escape(state.returnFocusId)}"]`)
      : null
    if (card) {
      card.focus()
      card.scrollIntoView({ block: 'nearest' })
    } else {
      outlet.querySelector('h1')?.setAttribute('tabindex', '-1')
      outlet.querySelector('h1')?.focus()
    }
  }

  if (state.focusSearch) {
    state.focusSearch = false
    search.focus()
    search.select()
  }

  if (options.reason === 'filter') {
    const count = visibleStudies().length
    announce(`${count} ${count === 1 ? 'match' : 'matches'}`)
  } else if (route.name === 'study') {
    const study = byId.get(route.id)
    const index = studies.findIndex((item) => item.id === study.id) + 1
    announce(`Study ${study.id}, ${study.title}. ${index} of ${studies.length}.`)
  } else if (route.name === 'missing') {
    announce(`No study ${route.id}.`)
  }
}

function setHash(hash) {
  const next = hash.startsWith('#') ? hash : `#${hash}`
  if ((location.hash || '#/') === (next || '#/')) return
  const url = new URL(location.href)
  url.hash = next
  history.pushState(null, '', url)
  render()
}

function focusFilter() {
  const route = resolveRoute(location.hash, studies)
  if (route.name !== 'gallery') {
    state.focusSearch = true
    setHash('#/')
    return
  }
  search.focus()
  search.select()
}

function onEscape() {
  const route = resolveRoute(location.hash, studies)
  if (route.name === 'study' || route.name === 'missing') {
    setHash('#/')
    return
  }
  if (state.query) {
    state.query = ''
    search.value = ''
    render({ reason: 'filter' })
    search.focus()
  }
}

function onStudyKey(event) {
  const route = resolveRoute(location.hash, studies)
  if (route.name !== 'study') return
  const key = event.key
  if (key === 'ArrowLeft' || key === 'h' || key === 'H') {
    event.preventDefault()
    setHash(`#/${neighborId(studies, route.id, -1)}`)
  } else if (key === 'ArrowRight' || key === 'l' || key === 'L') {
    event.preventDefault()
    setHash(`#/${neighborId(studies, route.id, 1)}`)
  } else if (key === 'Home') {
    event.preventDefault()
    setHash(`#/${studies[0].id}`)
  } else if (key === 'End') {
    event.preventDefault()
    setHash(`#/${studies[studies.length - 1].id}`)
  } else if (key === 'f' || key === 'F') {
    event.preventDefault()
    state.fit = state.fit === 'fit' ? 'actual' : 'fit'
    const stage = outlet.querySelector('.stage')
    const image = outlet.querySelector('.stage img')
    if (stage && image) {
      stage.dataset.fit = state.fit
      image.dataset.fit = state.fit
    }
    for (const button of outlet.querySelectorAll('[data-fit]')) {
      button.setAttribute('aria-pressed', String(button.dataset.fit === state.fit))
    }
  }
}

function onGalleryKey(event) {
  const direction = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    h: 'left',
    H: 'left',
    l: 'right',
    L: 'right',
    k: 'up',
    K: 'up',
    j: 'down',
    J: 'down',
    Home: 'home',
    End: 'end',
  }[event.key]
  if (!direction) return
  const items = [...outlet.querySelectorAll('[data-card]')]
  if (!items.length) return
  event.preventDefault()
  const active = document.activeElement?.closest?.('[data-card]')
  let index = items.indexOf(active)
  if (index < 0) {
    index = direction === 'left' || direction === 'up' || direction === 'end' ? items.length - 1 : 0
  } else {
    const columns = columnCountFromTops(items.map((item) => item.getBoundingClientRect().top))
    index = moveGridIndex(index, items.length, columns, direction)
  }
  items[index].focus()
  items[index].scrollIntoView({ block: 'nearest' })
}

document.addEventListener('click', (event) => {
  const link = event.target.closest?.('a[href^="#"]')
  if (!link) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  event.preventDefault()
  setHash(link.getAttribute('href'))
})

outlet.addEventListener('click', (event) => {
  const nav = event.target.closest?.('[data-nav]')
  if (nav) {
    const route = resolveRoute(location.hash, studies)
    if (route.name !== 'study') return
    setHash(`#/${neighborId(studies, route.id, Number(nav.dataset.nav))}`)
    return
  }
  const fit = event.target.closest?.('[data-fit]')
  if (fit) {
    state.fit = fit.dataset.fit === 'actual' ? 'actual' : 'fit'
    const stage = outlet.querySelector('.stage')
    const image = outlet.querySelector('.stage img')
    if (stage && image) {
      stage.dataset.fit = state.fit
      image.dataset.fit = state.fit
    }
    for (const button of outlet.querySelectorAll('[data-fit]')) {
      button.setAttribute('aria-pressed', String(button.dataset.fit === state.fit))
    }
    return
  }
  if (event.target.closest?.('[data-clear]')) {
    state.query = ''
    search.value = ''
    render({ reason: 'filter' })
    search.focus()
  }
})

search.addEventListener('input', () => {
  state.query = search.value
  if (resolveRoute(location.hash, studies).name !== 'gallery') return
  render({ reason: 'filter' })
})

function openHelp() {
  dialog.showModal()
  dialog.querySelector('#help-title')?.focus()
}

helpButton.addEventListener('click', openHelp)
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close()
})

document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (dialog.open) {
    if (event.key === '?') {
      event.preventDefault()
      dialog.close()
    }
    return
  }
  const typing = isTyping(event.target)
  if (event.key === '?' && !typing) {
    event.preventDefault()
    openHelp()
    return
  }
  if (event.key === '/' && !typing) {
    event.preventDefault()
    focusFilter()
    return
  }
  if (event.key === 'Escape') {
    const route = resolveRoute(location.hash, studies)
    if (route.name === 'study' || route.name === 'missing' || state.query) {
      event.preventDefault()
    }
    onEscape()
    return
  }
  if (typing) return
  const route = resolveRoute(location.hash, studies)
  if (route.name === 'study') onStudyKey(event)
  else if (route.name === 'gallery') onGalleryKey(event)
})

window.addEventListener('popstate', () => render())
window.addEventListener('hashchange', () => render())

render()
