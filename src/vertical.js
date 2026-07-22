/* Shared engine for the industry deep-dive pages (healthcare / construction).
   Same atmosphere + interaction language as the main site, plus the
   "document assembles itself" centerpiece. */
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)
history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add(time => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)

/* ------------------------------- atmosphere -------------------------------- */
const canvas = document.getElementById('gl')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
renderer.setSize(innerWidth, innerHeight)
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10)
const uniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  uScroll: { value: 0 },
  uAspect: { value: innerWidth / innerHeight },
}
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms, depthWrite: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime; uniform vec2 uMouse; uniform float uScroll; uniform float uAspect;
    float blob(vec2 p, vec2 c, float r){ vec2 d=p-c; d.x*=uAspect; return smoothstep(r,0.,length(d)); }
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    void main(){
      vec2 p=vUv; float t=uTime*0.05; float s=uScroll*0.35;
      vec3 cream=vec3(0.960,0.948,0.922), sand=vec3(0.938,0.906,0.842),
           amber=vec3(0.945,0.800,0.640), grey=vec3(0.905,0.895,0.875);
      vec3 col=mix(cream,sand,vUv.y*0.55);
      col=mix(col,sand, blob(p,vec2(0.24+sin(t)*0.10,fract(0.75-s*0.6)),0.55)*0.5);
      col=mix(col,amber,blob(p,vec2(0.78+cos(t*0.8)*0.08,fract(0.30-s*0.85)),0.42)*0.2);
      col=mix(col,grey, blob(p,vec2(0.55+sin(t*1.3)*0.12,fract(0.85-s*0.5)),0.48)*0.4);
      col=mix(col,amber,blob(p,uMouse,0.34)*0.12);
      col+=(hash(p*900.0+uTime*0.1)-0.5)*0.012;
      gl_FragColor=vec4(col,1.0);
    }`,
})))
const N = 420
const pts = new Float32Array(N * 3), spd = new Float32Array(N)
for (let i = 0; i < N; i++) {
  pts[i * 3] = Math.random() * 2 - 1
  pts[i * 3 + 1] = Math.random() * 2 - 1
  spd[i] = 0.12 + Math.random() * 0.5
}
const moteGeo = new THREE.BufferGeometry()
moteGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
  color: 0xb98a54, size: 1.7, sizeAttenuation: false,
  transparent: true, opacity: 0.15, depthWrite: false,
}))
scene.add(motes)

/* ------------------------------ interactions ------------------------------- */
const mouse = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5 }
addEventListener('pointermove', e => {
  mouse.x = e.clientX / innerWidth
  mouse.y = e.clientY / innerHeight
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
addEventListener('pointerdown', e => {
  if (e.target.closest('.btn, .nav-cta, a, button')) return
  const b = document.createElement('div')
  b.className = 'blip'
  b.style.left = e.clientX + 'px'; b.style.top = e.clientY + 'px'
  document.body.appendChild(b)
  setTimeout(() => b.remove(), 720)
})

const io = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) e.target.classList.add('on') })
}, { threshold: 0.14 })
document.querySelectorAll('.reveal').forEach(el => io.observe(el))

// counters
const numIo = new IntersectionObserver(es => {
  es.forEach(en => {
    if (!en.isIntersecting) return
    numIo.unobserve(en.target)
    const target = parseInt(en.target.dataset.count, 10)
    const proxy = { v: 0 }
    gsap.to(proxy, { v: target, duration: 1.7, ease: 'power2.out',
      onUpdate: () => { en.target.textContent = String(Math.round(proxy.v)) } })
  })
}, { threshold: 0.6 })
document.querySelectorAll('[data-count]').forEach(el => numIo.observe(el))

// media parallax like the home page
gsap.utils.toArray('.frame img').forEach(img => {
  gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none',
    scrollTrigger: { trigger: img.closest('.frame'), start: 'top bottom', end: 'center center', scrub: 1 } })
})
gsap.utils.toArray('.outline').forEach(el => {
  const dir = el.classList.contains('flip') ? -1 : 1
  gsap.fromTo(el, { xPercent: 6 * dir }, { xPercent: -6 * dir, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } })
})

/* ------------------- the "document assembles itself" moment ----------------- */
const cfgEl = document.getElementById('page-config')
if (cfgEl) {
  const cfg = JSON.parse(cfgEl.textContent)
  const chipsWrap = document.querySelector('.chips')
  const linesWrap = document.querySelector('.doc-lines')
  const docStatus = document.querySelector('.doc-status')
  const docStamp = document.querySelector('.doc-stamp')

  cfg.chips.forEach(([time, label]) => {
    const c = document.createElement('div')
    c.className = 'chip'
    c.innerHTML = `<i></i><em>${time}</em><span>${label}</span>`
    chipsWrap.appendChild(c)
  })
  const widths = [92, 78, 85, 64, 88, 72, 81, 58]
  cfg.chips.forEach((_, i) => {
    const l = document.createElement('div')
    l.className = 'doc-line'
    l.style.width = widths[i % widths.length] + '%'
    linesWrap.appendChild(l)
  })
  const chips = [...chipsWrap.children]
  const lines = [...linesWrap.children]

  let running = false
  const asmIo = new IntersectionObserver(es => {
    es.forEach(en => {
      running = en.isIntersecting
      if (running && !tl.isActive() && tl.progress() === 0) tl.play()
      running ? tl.play() : tl.pause()
    })
  }, { threshold: 0.3 })
  asmIo.observe(document.querySelector('.assembly'))

  const doc = document.querySelector('.doc')
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2.6 })
  chips.forEach((chip, i) => {
    const at = i * 0.85
    tl.to(chip, {
      x: () => doc.getBoundingClientRect().left - chip.getBoundingClientRect().left + 40,
      y: () => doc.getBoundingClientRect().top - chip.getBoundingClientRect().top + 70 + i * 6,
      scale: 0.3, opacity: 0, duration: 0.9, ease: 'power2.in',
    }, at)
    tl.call(() => lines[i].classList.add('on'), null, at + 0.8)
  })
  tl.call(() => {
    docStatus.textContent = cfg.done
    docStamp.classList.add('on')
  }, null, chips.length * 0.85 + 0.4)
  tl.to({}, { duration: 2.4 }, chips.length * 0.85 + 0.5) // hold
  tl.eventCallback('onRepeat', () => {
    gsap.set(chips, { clearProps: 'all' })
    lines.forEach(l => l.classList.remove('on'))
    docStamp.classList.remove('on')
    docStatus.textContent = cfg.compiling
    tl.invalidate()
  })
  docStatus.textContent = cfg.compiling
}

/* -------------------------------- render loop ------------------------------- */
const clock = new THREE.Clock()
let scrollSmooth = 0, scrollPrev = 0, vel = 0
setInterval(() => { if (document.hidden) { gsap.ticker.tick(); tick(true) } }, 60)

function tick(manual) {
  const t = clock.getElapsedTime()
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
  const target = scrollY / max
  scrollSmooth += (target - scrollSmooth) * 0.08
  vel += ((scrollSmooth - scrollPrev) * 60 - vel) * 0.08
  scrollPrev = scrollSmooth

  mouse.sx += (mouse.x - mouse.sx) * 0.07
  mouse.sy += (mouse.y - mouse.sy) * 0.07

  uniforms.uTime.value = t
  uniforms.uScroll.value = scrollSmooth
  uniforms.uMouse.value.set(mouse.sx, 1 - mouse.sy)

  const arr = moteGeo.attributes.position.array
  for (let i = 0; i < N; i++) {
    arr[i * 3 + 1] += (0.0006 + Math.abs(vel) * 0.004) * spd[i]
    if (arr[i * 3 + 1] > 1.02) { arr[i * 3 + 1] = -1.02; arr[i * 3] = Math.random() * 2 - 1 }
  }
  moteGeo.attributes.position.needsUpdate = true

  const skew = Math.max(-1.4, Math.min(1.4, vel * 34))
  document.documentElement.style.setProperty('--skew', skew.toFixed(3) + 'deg')

  if (glow) glow.style.transform =
    `translate(${mouse.sx * innerWidth}px, ${mouse.sy * innerHeight}px) translate(-50%,-50%)`
  if (scrollFill) scrollFill.style.width = (target * 100).toFixed(2) + '%'

  renderer.render(scene, camera)
  if (!manual) requestAnimationFrame(() => tick(false))
}
tick(false)

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight)
  uniforms.uAspect.value = innerWidth / innerHeight
  ScrollTrigger.refresh()
})
