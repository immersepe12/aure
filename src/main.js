import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)
history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

/* ------------------------------ smooth scroll ------------------------------- */
const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add(time => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
lenis.stop() // released when the preloader finishes

/* ----------------------- atmosphere (the only WebGL) -----------------------
   One fullscreen shader quad + one particle cloud. Elemental, cheap, smooth. */
const canvas = document.getElementById('gl')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
renderer.setSize(window.innerWidth, window.innerHeight)

const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10)

const uniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  uScroll: { value: 0 },
  uAspect: { value: window.innerWidth / window.innerHeight },
}
const field = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    uniforms,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uScroll;
      uniform float uAspect;

      float blob(vec2 p, vec2 c, float r) {
        vec2 d = p - c; d.x *= uAspect;
        return smoothstep(r, 0.0, length(d));
      }
      // cheap value noise for a breathing paper feel
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      void main() {
        vec2 p = vUv;
        float t = uTime * 0.05;
        float s = uScroll * 0.35;

        vec3 cream = vec3(0.960, 0.948, 0.922);
        vec3 sand  = vec3(0.938, 0.906, 0.842);
        vec3 amber = vec3(0.945, 0.800, 0.640);
        vec3 grey  = vec3(0.905, 0.895, 0.875);

        vec3 col = mix(cream, sand, vUv.y * 0.55);

        // drifting elemental blobs — scroll slides the weather system upward
        col = mix(col, sand,  blob(p, vec2(0.24 + sin(t)        * 0.10, fract(0.75 - s * 0.6) ), 0.55) * 0.5);
        col = mix(col, amber, blob(p, vec2(0.78 + cos(t * 0.8)  * 0.08, fract(0.30 - s * 0.85)), 0.42) * 0.2);
        col = mix(col, grey,  blob(p, vec2(0.55 + sin(t * 1.3)  * 0.12, fract(0.85 - s * 0.5) ), 0.48) * 0.4);
        col = mix(col, amber, blob(p, vec2(0.15 + cos(t * 0.6)  * 0.07, fract(0.15 - s * 0.7) ), 0.30) * 0.12);

        // the light follows the cursor, faintly
        col = mix(col, amber, blob(p, uMouse, 0.34) * 0.12);

        // fine paper noise
        col += (hash(p * 900.0 + uTime * 0.1) - 0.5) * 0.012;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
)
scene.add(field)

// elemental motes — drift upward like dust in window light
const N = 520
const pts = new Float32Array(N * 3)
const spd = new Float32Array(N)
for (let i = 0; i < N; i++) {
  pts[i * 3] = Math.random() * 2 - 1
  pts[i * 3 + 1] = Math.random() * 2 - 1
  pts[i * 3 + 2] = 0
  spd[i] = 0.12 + Math.random() * 0.5
}
const moteGeo = new THREE.BufferGeometry()
moteGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
  color: 0xb98a54, size: 1.7, sizeAttenuation: false,
  transparent: true, opacity: 0.16, depthWrite: false,
}))
scene.add(motes)

/* -------------------------------- interaction ------------------------------- */
const mouse = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5 }
window.addEventListener('pointermove', e => {
  mouse.x = e.clientX / window.innerWidth
  mouse.y = e.clientY / window.innerHeight
})

const glow = document.getElementById('glow')
const scrollFill = document.getElementById('scroll-fill')

document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect()
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`
  })
  el.addEventListener('pointerleave', () => { el.style.transform = '' })
})

const io = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) e.target.classList.add('on') })
}, { threshold: 0.16 })
document.querySelectorAll('.reveal').forEach(el => io.observe(el))

/* ----------------------- "the site is listening" layer ---------------------- */

// REC-mode hover: every photo frame gets a pan wrapper, an amber border trace
// and a ticking ● REC chip. Injected before the scroll scrubs bind.
const activeRecs = new Map() // frame -> start time
document.querySelectorAll('.frame').forEach(frame => {
  const img = frame.querySelector('img')
  const pan = document.createElement('div')
  pan.className = 'pan'
  frame.insertBefore(pan, img)
  pan.appendChild(img)

  const chip = document.createElement('div')
  chip.className = 'rec-chip'
  chip.innerHTML = 'REC <span class="rec-clock">00:00</span>'
  frame.appendChild(chip)
  const clock = chip.querySelector('.rec-clock')

  frame.addEventListener('pointerenter', () => activeRecs.set(frame, { t0: performance.now(), clock }))
  frame.addEventListener('pointerleave', () => {
    activeRecs.delete(frame)
    pan.style.transform = ''
  })
  frame.addEventListener('pointermove', e => {
    const r = frame.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    pan.style.transform = `translate(${x * 14}px, ${y * 14}px) scale(1.04)`
  })
})

// click = record blip
window.addEventListener('pointerdown', e => {
  if (e.target.closest('.btn, .nav-cta, a')) return
  const b = document.createElement('div')
  b.className = 'blip'
  b.style.left = e.clientX + 'px'
  b.style.top = e.clientY + 'px'
  document.body.appendChild(b)
  setTimeout(() => b.remove(), 720)
})

// numbers count up when seen
const numIo = new IntersectionObserver(es => {
  es.forEach(en => {
    if (!en.isIntersecting) return
    numIo.unobserve(en.target)
    const span = en.target
    const target = parseInt(span.dataset.count, 10)
    const proxy = { v: 0 }
    gsap.to(proxy, {
      v: target, duration: 1.7, ease: 'power2.out',
      onUpdate: () => { span.textContent = String(Math.round(proxy.v)) },
    })
  })
}, { threshold: 0.6 })
document.querySelectorAll('[data-count]').forEach(el => numIo.observe(el))

// playback timeline: scroll is the scrubber, the page is a recording
const railEl = document.querySelector('.rail')
railEl.innerHTML = '<div class="rail-track"><div class="rail-head"></div></div><div class="rail-time"><b>00:00</b>&thinsp;/&thinsp;05:32</div>'
const railTrack = railEl.querySelector('.rail-track')
const railHead = railEl.querySelector('.rail-head')
const railTime = railEl.querySelector('.rail-time b')
const RAIL_TOTAL = 332 // the "recording length" of the page, in seconds
function buildRailTicks() {
  railTrack.querySelectorAll('.rail-tick').forEach(t => t.remove())
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
  document.querySelectorAll('main > section').forEach(sec => {
    const frac = Math.min(1, sec.offsetTop / max)
    const tick = document.createElement('div')
    tick.className = 'rail-tick'
    tick.style.top = (frac * 100) + '%'
    tick.addEventListener('click', () => lenis.scrollTo(sec.offsetTop, { duration: 1.4 }))
    railTrack.appendChild(tick)
  })
}
buildRailTicks()
addEventListener('load', buildRailTicks)
addEventListener('resize', buildRailTicks)

// headings transcribe themselves into view
document.querySelectorAll('.serif.reveal, h3.reveal, .hero-sub.reveal').forEach(el => el.classList.add('transcribe'))

// custom cursor — a quiet ring that becomes REC over media
const cur = document.getElementById('cur')
const curdot = document.getElementById('curdot')
let curX = innerWidth / 2, curY = innerHeight / 2
const hoverables = 'a, button, .btn, .nav-cta, .ind, .dive, .rail-tick'
document.addEventListener('pointerover', e => {
  if (e.target.closest(hoverables)) cur.classList.add('hov')
  if (e.target.closest('.frame')) cur.classList.add('frame-hov')
})
document.addEventListener('pointerout', e => {
  if (e.target.closest(hoverables)) cur.classList.remove('hov')
  if (e.target.closest('.frame')) cur.classList.remove('frame-hov')
})

// hero waveform — idles like a quiet room, excites under the cursor
const waveCanvas = document.querySelector('.wave')
const waveCtx = waveCanvas.getContext('2d')
{
  const dpr = Math.min(devicePixelRatio, 2)
  waveCanvas.width = 720 * dpr
  waveCanvas.height = 88 * dpr
  waveCtx.scale(dpr, dpr)
}
let nextBurst = 2 + Math.random() * 3, burstStart = -10
function drawWave(t, cursorSpeed) {
  waveCtx.clearRect(0, 0, 720, 88)
  const r = waveCanvas.getBoundingClientRect()
  if (r.bottom < 0 || r.top > innerHeight) return
  if (t > nextBurst) { burstStart = t; nextBurst = t + 3 + Math.random() * 4 }
  const burst = Math.exp(-(t - burstStart) * 2.4) * 13

  const cx = (mouse.x * innerWidth - r.left) / Math.max(1, r.width) * 720
  const cy = mouse.y * innerHeight
  const nearY = Math.max(0, 1 - Math.abs(cy - (r.top + r.height / 2)) / 200)

  waveCtx.beginPath()
  for (let x = 0; x <= 720; x += 5) {
    const g = Math.exp(-(((x - cx) / 95) ** 2)) * nearY
    const amp = 4
      + Math.sin(t * 1.7 + x * 0.018) * 2.5
      + burst * (0.5 + 0.5 * Math.sin(x * 0.05 + t * 9))
      + g * (10 + cursorSpeed * 260)
    const y = 44 + Math.sin(x * 0.045 + t * 2.8) * amp
    x === 0 ? waveCtx.moveTo(x, y) : waveCtx.lineTo(x, y)
  }
  waveCtx.strokeStyle = 'rgba(217,122,48,0.85)'
  waveCtx.lineWidth = 1.8
  waveCtx.shadowColor = 'rgba(217,122,48,0.5)'
  waveCtx.shadowBlur = 9
  waveCtx.stroke()
  waveCtx.shadowBlur = 0
}

/* -------------------------- org intelligence viz ---------------------------- */
const INDUSTRY = {
  healthcare: {
    top: ['Dept. of Medicine', 'HOD'],
    mid: [['Dr. Mehta', 'Ward 6'], ['Dr. Rao', 'Ward 7'], ['Dr. Iyer', 'ICU']],
    low: [['Nurse', '6A'], ['Nurse', '6B'], ['Nurse', '7A'], ['Nurse', '7B'], ['Nurse', 'ICU-1'], ['Nurse', 'ICU-2']],
    ticks: [
      'Discharge summary drafted — Bed 12',
      'Progress notes: 14 combined overnight',
      'Cardiology flag routed to Dr. Mehta',
      'Patient journey updated — Bed 07',
    ],
    cards: {
      rollup: 'Every ward round, every handover — captured at the bedside and combined upward.',
      route: 'Each level sees what it needs: summaries for HODs, tasks for the floor.',
      journey: 'Weeks of notes become one patient story — progress, decisions, outcomes.',
    },
  },
  construction: {
    top: ['Site Alpha', 'Project Head'],
    mid: [['Civil Lead', 'Block A'], ['MEP Lead', 'Block B'], ['Safety Lead', 'Site']],
    low: [['Foreman', 'A1'], ['Foreman', 'A2'], ['Crew', 'B1'], ['Crew', 'B2'], ['Inspector', 'S1'], ['Stores', 'S2']],
    ticks: [
      'Daily site report compiled — Block A',
      'Steel delivery delay flagged to Project Head',
      'Safety observation routed to Safety Lead',
      '32 voice logs merged today',
    ],
    cards: {
      rollup: 'Every toolbox talk, every site walk — logged by voice and combined upward.',
      route: 'Leads see blockers and progress; crews get the morning’s tasks.',
      journey: 'Months of logs become the project record — delays, decisions, deliveries.',
    },
  },
}

const vizSvg = document.querySelector('.org-viz')
const SVGNS = 'http://www.w3.org/2000/svg'
let flowDots = [], vizActive = false, tickIdx = 0

function svgEl(tag, attrs, parent) {
  const el = document.createElementNS(SVGNS, tag)
  for (const k in attrs) el.setAttribute(k, attrs[k])
  parent.appendChild(el)
  return el
}
function nodeCard(x, y, w, h, label, sub, parent) {
  const g = svgEl('g', { transform: `translate(${x},${y})` }, parent)
  svgEl('rect', { class: 'node-box', x: -w / 2, y: -h / 2, width: w, height: h, rx: 14 }, g)
  svgEl('rect', { class: 'node-seam', x: -w * 0.24, y: -h / 2 - 1, width: w * 0.48, height: 2.4, rx: 1.2 }, g)
  svgEl('rect', { class: 'node-chip', x: -w / 2 + 12, y: -6, width: 9, height: 13, rx: 2.5 }, g)
  const t1 = svgEl('text', { class: 'node-label', x: -w / 2 + 30, y: -1 }, g)
  t1.textContent = label
  const t2 = svgEl('text', { class: 'node-sub', x: -w / 2 + 30, y: 15 }, g)
  t2.textContent = sub
  return g
}
function buildViz(key) {
  vizSvg.innerHTML = ''
  flowDots = []
  const d = INDUSTRY[key]
  const TOP = { x: 450, y: 80, w: 190, h: 66 }
  const MIDX = [230, 450, 670], MIDY = 280
  const LOWX = [110, 246, 382, 518, 654, 790], LOWY = 480

  const links = svgEl('g', {}, vizSvg)
  const nodes = svgEl('g', {}, vizSvg)
  const dotsG = svgEl('g', {}, vizSvg)

  const midNodes = d.mid.map(([l, s], i) => nodeCard(MIDX[i], MIDY, 168, 62, l, s, nodes))
  const topNode = nodeCard(TOP.x, TOP.y, TOP.w, TOP.h, d.top[0], d.top[1], nodes)
  const lowNodes = d.low.map(([l, s], i) => nodeCard(LOWX[i], LOWY, 122, 56, l, s, nodes))

  const mkPath = (x1, y1, x2, y2) =>
    svgEl('path', { class: 'link', d: `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}` }, links)

  d.low.forEach((_, i) => {
    const m = Math.floor(i / 2)
    const p = mkPath(LOWX[i], LOWY - 28, MIDX[m], MIDY + 31)
    // 1-2 notes flowing per caregiver/crew
    for (let k = 0; k < (i % 2 ? 1 : 2); k++) {
      flowDots.push({
        path: p, len: p.getTotalLength(),
        speed: 0.10 + Math.random() * 0.07, off: Math.random(),
        prev: 0, target: midNodes[m],
        el: svgEl('circle', { class: 'flow-dot', r: 3.4 }, dotsG),
      })
    }
  })
  d.mid.forEach((_, i) => {
    const p = mkPath(MIDX[i], MIDY - 31, TOP.x, TOP.y + 33)
    flowDots.push({
      path: p, len: p.getTotalLength(),
      speed: 0.09 + Math.random() * 0.05, off: Math.random(),
      prev: 0, target: topNode,
      el: svgEl('circle', { class: 'flow-dot', r: 4 }, dotsG),
    })
  })
}
buildViz('healthcare')

function vizFrame(t) {
  if (!vizActive) return
  flowDots.forEach(d => {
    const p = (t * d.speed + d.off) % 1
    const pt = d.path.getPointAtLength(p * d.len)
    d.el.setAttribute('cx', pt.x)
    d.el.setAttribute('cy', pt.y)
    d.el.setAttribute('opacity', String(0.35 + Math.min(1, (1 - p)) * 0.65))
    if (p < d.prev) { // arrived — pulse the receiving node
      d.target.classList.add('pulse')
      clearTimeout(d.target._pt)
      d.target._pt = setTimeout(() => d.target.classList.remove('pulse'), 480)
    }
    d.prev = p
  })
}

// insight ticker
const ticker = document.querySelector('.insight-ticker')
const tickText = ticker.querySelector('.tick-text')
let industry = 'healthcare'
setInterval(() => {
  if (!vizActive) return
  ticker.classList.add('swap')
  setTimeout(() => {
    tickIdx = (tickIdx + 1) % INDUSTRY[industry].ticks.length
    tickText.textContent = INDUSTRY[industry].ticks[tickIdx]
    ticker.classList.remove('swap')
  }, 450)
}, 3800)

// industry toggle
document.querySelectorAll('.industry-toggle .ind').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.ind === industry) return
    industry = btn.dataset.ind
    document.querySelectorAll('.industry-toggle .ind')
      .forEach(b => b.classList.toggle('active', b === btn))
    buildViz(industry)
    tickIdx = 0
    tickText.textContent = INDUSTRY[industry].ticks[0]
    const cards = INDUSTRY[industry].cards
    document.querySelectorAll('.tcard [data-copy]')
      .forEach(el => { el.textContent = cards[el.dataset.copy] })
  })
})

const teamsIo = new IntersectionObserver(es => {
  es.forEach(en => { vizActive = en.isIntersecting })
}, { threshold: 0.15 })
teamsIo.observe(document.querySelector('.teams'))

/* ------------------------- transcript demo (typewriter) --------------------- */
const TSCRIPT = 'Patient reports chest tightness since Tuesday, worse on exertion. BP one-thirty-eight over eighty-eight, sats ninety-seven, afebrile. Impression: likely angina — will flag cardiology. Start ECG today, troponin panel, review at six AM.'
const typedEl = document.querySelector('.typed')
const noteFields = [...document.querySelectorAll('.note-field')]
const noteSummary = document.querySelector('.note-summary')
const MILESTONES = [
  { at: 0.24, el: noteFields[0] },
  { at: 0.52, el: noteFields[1] },
  { at: 0.74, el: noteFields[2] },
  { at: 0.95, el: noteFields[3] },
]
let demoVisible = false, demoTimer = null, charIdx = 0

function demoStep() {
  if (!demoVisible) return
  charIdx++
  if (charIdx <= TSCRIPT.length) {
    typedEl.textContent = TSCRIPT.slice(0, charIdx)
    const prog = charIdx / TSCRIPT.length
    MILESTONES.forEach(m => { if (prog >= m.at) m.el.classList.add('on') })
    demoTimer = setTimeout(demoStep, 30 + Math.random() * 26)
  } else {
    noteSummary.classList.add('on')
    demoTimer = setTimeout(() => { // hold, then loop
      charIdx = 0
      typedEl.textContent = ''
      noteFields.forEach(f => f.classList.remove('on'))
      noteSummary.classList.remove('on')
      demoTimer = setTimeout(demoStep, 900)
    }, 4200)
  }
}
const demoIo = new IntersectionObserver(es => {
  es.forEach(en => {
    demoVisible = en.isIntersecting
    if (demoVisible && !demoTimer) demoStep()
    if (!demoVisible && demoTimer) { clearTimeout(demoTimer); demoTimer = null }
  })
}, { threshold: 0.25 })
demoIo.observe(document.querySelector('.demo'))

/* ------------------ hold-to-speak: the site actually listens ----------------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition
const tryit = document.querySelector('.tryit')
let liveMode = false, recog = null, micStream = null, analyser = null, meterData = null
const meterBars = [...document.querySelectorAll('.tryit-meter i')]

if (SR && tryit) {
  tryit.hidden = false
  const btn = tryit.querySelector('.tryit-btn')
  const label = tryit.querySelector('.tryit-label')
  const noteTitle = document.querySelector('.note-title')
  const origTitle = noteTitle.textContent
  const origFields = noteFields.map(f => ({
    em: f.querySelector('em').textContent,
    span: f.querySelector('span').textContent,
  }))
  const origSummary = noteSummary.innerHTML
  let finalText = '', restoreTimer = null

  function setField(i, em, span, on) {
    noteFields[i].querySelector('em').textContent = em
    noteFields[i].querySelector('span').textContent = span
    noteFields[i].classList.toggle('on', on)
  }
  function restoreScripted() {
    noteTitle.textContent = origTitle
    origFields.forEach((o, i) => setField(i, o.em, o.span, false))
    noteSummary.innerHTML = origSummary
    noteSummary.classList.remove('on')
    typedEl.textContent = ''
    charIdx = 0
    if (demoVisible && !demoTimer) demoTimer = setTimeout(demoStep, 600)
  }

  async function startLive() {
    if (liveMode) return
    liveMode = true
    clearTimeout(demoTimer); demoTimer = null
    clearTimeout(restoreTimer)
    document.body.classList.add('recording')
    label.textContent = 'Listening — keep holding'
    noteTitle.textContent = 'Your note · live'
    noteFields.forEach(f => f.classList.remove('on'))
    noteSummary.classList.remove('on')
    typedEl.textContent = ''
    finalText = ''

    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      const src = ac.createMediaStreamSource(micStream)
      analyser = ac.createAnalyser()
      analyser.fftSize = 64
      meterData = new Uint8Array(analyser.frequencyBinCount)
      src.connect(analyser)
    } catch { /* meter is optional */ }

    recog = new SR()
    recog.continuous = true
    recog.interimResults = true
    recog.lang = 'en-IN'
    recog.onresult = e => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      typedEl.textContent = (finalText + interim).trim()
    }
    recog.onerror = ev => {
      if (ev.error === 'not-allowed') label.textContent = 'Mic blocked — allow access and retry'
    }
    try { recog.start() } catch { /* already started */ }
  }

  function stopLive() {
    if (!liveMode) return
    liveMode = false
    document.body.classList.remove('recording')
    label.textContent = 'Hold to speak — try it yourself'
    try { recog && recog.stop() } catch {}
    micStream?.getTracks().forEach(t => t.stop())
    analyser = null

    // structure what was said — entirely in this browser
    setTimeout(() => {
      const text = (finalText || typedEl.textContent || '').trim()
      if (!text) { restoreScripted(); return }
      const sentences = text.split(/(?<=[.!?])\s+|,\s+(?=and\s)/).filter(s => s.trim())
      const actionRe = /\b(will|need|should|must|tomorrow|today|call|send|schedule|review|follow|remind|order|book)\b/i
      const actions = sentences.filter(s => actionRe.test(s))
      const rest = sentences.filter(s => !actions.includes(s)).slice(1)
      setField(0, 'You said', sentences[0] || text, true)
      setTimeout(() => setField(1, 'Details', rest.length ? rest.join(' ') : '—', true), 250)
      setTimeout(() => setField(2, 'Actions', actions.length ? actions.join(' ') : 'None detected', true), 500)
      setTimeout(() => {
        setField(3, 'Meta', `${text.split(/\s+/).length} words · structured on your device`, true)
        noteSummary.innerHTML = '<span>Nothing left this page</span><strong>That was Aure, live ✓</strong>'
        noteSummary.classList.add('on')
      }, 750)
      restoreTimer = setTimeout(restoreScripted, 9000)
    }, 350)
  }

  btn.addEventListener('pointerdown', e => { e.preventDefault(); startLive() })
  btn.addEventListener('pointerup', stopLive)
  btn.addEventListener('pointercancel', stopLive)
  btn.addEventListener('pointerleave', stopLive)
  btn.addEventListener('contextmenu', e => e.preventDefault())
}


/* --------------------------- scroll choreography ----------------------------
   DOM transforms only, scrubbed — no pins, no cross-scene state. */

// media frames: image settles from 1.14 to 1.0 as the frame crosses the viewport
gsap.utils.toArray('.frame img').forEach(img => {
  gsap.fromTo(img, { scale: 1.14 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: img.closest('.frame'), start: 'top bottom', end: 'center center', scrub: 1 },
  })
})

// media frames drift slower than the page (depth)
gsap.utils.toArray('.frame').forEach(f => {
  gsap.fromTo(f, { y: 60 }, {
    y: -60, ease: 'none',
    scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: 1 },
  })
})

// outlined statements slide laterally as they pass…
gsap.utils.toArray('.outline').forEach(el => {
  const dir = el.classList.contains('flip') ? -1 : 1
  gsap.fromTo(el, { xPercent: 7 * dir }, {
    xPercent: -7 * dir, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 },
  })
})
// …and fill with ink like a level meter as you scroll through them
gsap.utils.toArray('.outline .fill').forEach(el => {
  gsap.fromTo(el, { clipPath: 'inset(-5% 100% -5% 0)' }, {
    clipPath: 'inset(-5% 0% -5% 0)', ease: 'none',
    scrollTrigger: { trigger: el.closest('.strip'), start: 'top 85%', end: 'bottom 45%', scrub: 1 },
  })
})

// hero image: gentle parallax out
gsap.to('.hero-media', {
  yPercent: -14, scale: 1.05, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'bottom 96%', end: 'bottom 30%', scrub: 1 },
})

/* -------------------------------- preloader --------------------------------- */
const loaderEl = document.getElementById('loader')
const pctEl = document.getElementById('loader-pct')
const fillEl = document.getElementById('loader-fill')
const heroImg = document.querySelector('.hero-media img')

const preloadList = [
  '/renders/card-hero.png', '/renders/card-in-wallet.png', '/renders/card-on-phone.png',
  '/renders/card-side-button.png', '/renders/card-master-reference.png',
]
let loaded = 0, ready = false
function bump() {
  loaded++
  const p = Math.round((loaded / preloadList.length) * 100)
  pctEl.textContent = String(p)
  fillEl.style.width = p + '%'
  if (loaded >= preloadList.length) finishLoad()
}
function finishLoad() {
  if (ready) return
  ready = true
  pctEl.textContent = '100'
  fillEl.style.width = '100%'
  setTimeout(() => {
    loaderEl.classList.add('done')
    document.body.classList.remove('loading')
    lenis.start()
    gsap.from('.hero-title span', {
      yPercent: 118, opacity: 0, rotate: -5,
      duration: 1.25, stagger: 0.085, ease: 'power4.out', delay: 0.1,
    })
    gsap.fromTo('.hero-media', {
      clipPath: 'inset(14% 14% 14% 14% round 40px)', scale: 1.08,
    }, {
      clipPath: 'inset(0% 0% 0% 0% round 28px)', scale: 1,
      duration: 1.5, ease: 'power3.inOut', delay: 0.35,
      clearProps: 'clipPath',
    })
    ScrollTrigger.refresh()
  }, 380)
}
preloadList.forEach(src => {
  const im = new Image()
  im.onload = bump; im.onerror = bump
  im.src = src
})
setTimeout(finishLoad, 6000)

/* -------------------------------- render loop ------------------------------- */
const clock = new THREE.Clock()
let scrollSmooth = 0, scrollPrev = 0, vel = 0
setInterval(() => { if (document.hidden) { gsap.ticker.tick(); tick(true) } }, 60)

function tick(manual) {
  const t = clock.getElapsedTime()

  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
  const target = window.scrollY / max
  scrollSmooth += (target - scrollSmooth) * 0.08
  const v = scrollSmooth - scrollPrev
  scrollPrev = scrollSmooth
  vel += (v * 60 - vel) * 0.08

  const pmx = mouse.sx, pmy = mouse.sy
  mouse.sx += (mouse.x - mouse.sx) * 0.07
  mouse.sy += (mouse.y - mouse.sy) * 0.07
  const cursorSpeed = Math.abs(mouse.sx - pmx) + Math.abs(mouse.sy - pmy)

  // shader weather
  uniforms.uTime.value = t
  uniforms.uScroll.value = scrollSmooth
  uniforms.uMouse.value.set(mouse.sx, 1 - mouse.sy)

  // motes rise; scroll pushes them like wind
  const recBoost = document.body.classList.contains('recording') ? 0.004 : 0
  const arr = moteGeo.attributes.position.array
  for (let i = 0; i < N; i++) {
    arr[i * 3 + 1] += (0.0006 + recBoost + Math.abs(vel) * 0.004) * spd[i]
    arr[i * 3] += Math.sin(t * 0.4 + i) * 0.00006
    if (arr[i * 3 + 1] > 1.02) { arr[i * 3 + 1] = -1.02; arr[i * 3] = Math.random() * 2 - 1 }
  }
  moteGeo.attributes.position.needsUpdate = true
  motes.material.opacity = 0.13 + (recBoost ? 0.1 : 0) + Math.min(0.14, Math.abs(vel) * 1.1)

  // velocity skew on media — the Shopify touch (subtle, clamped)
  const skew = Math.max(-1.4, Math.min(1.4, vel * 34))
  document.documentElement.style.setProperty('--skew', skew.toFixed(3) + 'deg')

  if (glow) glow.style.transform =
    `translate(${mouse.sx * innerWidth}px, ${mouse.sy * innerHeight}px) translate(-50%,-50%)`
  if (scrollFill) scrollFill.style.width = (target * 100).toFixed(2) + '%'

  // the hero waveform listens to the cursor
  drawWave(t, cursorSpeed)

  // org intelligence flow
  vizFrame(t)

  // tick the REC clocks on hovered frames
  activeRecs.forEach(({ t0, clock }) => {
    const s = Math.floor((performance.now() - t0) / 1000)
    clock.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  })

  // custom cursor: dot snaps, ring glides
  const mx = mouse.x * innerWidth, my = mouse.y * innerHeight
  curX += (mx - curX) * 0.16
  curY += (my - curY) * 0.16
  cur.style.left = curX + 'px'; cur.style.top = curY + 'px'
  curdot.style.left = mx + 'px'; curdot.style.top = my + 'px'

  // playback rail: playhead position + elapsed "recording time"
  railHead.style.top = (target * 100) + '%'
  const el2 = Math.round(target * RAIL_TOTAL)
  railTime.textContent = `${String(Math.floor(el2 / 60)).padStart(2, '0')}:${String(el2 % 60).padStart(2, '0')}`

  // live mic meter while holding to speak
  if (analyser && meterData) {
    analyser.getByteFrequencyData(meterData)
    meterBars.forEach((bar, i) => {
      const v = meterData[2 + i * 4] / 255
      bar.style.height = (5 + v * 21) + 'px'
    })
  }

  renderer.render(scene, camera)
  if (!manual) requestAnimationFrame(() => tick(false))
}
tick(false)

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  uniforms.uAspect.value = window.innerWidth / window.innerHeight
  ScrollTrigger.refresh()
})
