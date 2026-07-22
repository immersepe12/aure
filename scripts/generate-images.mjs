// Aure prototype image generator — OpenRouter image models.
// Usage: npm run images            (generates all prompts missing from public/renders)
//        npm run images -- --all   (regenerates everything)
//        npm run images -- hero-pod-dark magsafe-phone-call   (specific ids)
import 'dotenv/config'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'renders')
mkdirSync(outDir, { recursive: true })

const API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'openai/gpt-image-1'
if (!API_KEY) {
  console.error('Missing OPENROUTER_API_KEY. Copy .env.example to .env and add your key.')
  process.exit(1)
}

const { designLanguage, images } = JSON.parse(readFileSync(join(root, 'scripts', 'prompts.json'), 'utf8'))
const argIds = process.argv.slice(2).filter(a => a !== '--all')
const force = process.argv.includes('--all') || argIds.length > 0

const aspectHint = { landscape: '16:9 wide landscape', portrait: '3:4 vertical portrait', square: '1:1 square' }

// Approved master reference — pinned into every subsequent generation as a
// visual anchor so the model reproduces THIS device, not just the description.
const REFERENCE_PATH = join(outDir, 'card-master-reference.png')
const REFERENCE_DATA_URL = existsSync(REFERENCE_PATH)
  ? `data:image/png;base64,${readFileSync(REFERENCE_PATH).toString('base64')}`
  : null
const REFERENCE_INSTRUCTION = REFERENCE_DATA_URL
  ? 'The attached reference image shows the EXACT product to depict. Every proportion, material, colour, texture pattern, button placement, wordmark, magnet ring, port, edge seam, and finish in your output must match the attached reference exactly. Change only the SCENE described in the prompt below — never the device itself.'
  : ''

async function generate({ id, prompt, aspect }) {
  const outPath = join(outDir, `${id}.png`)
  if (!force && existsSync(outPath)) return console.log(`skip   ${id} (exists)`)
  const fullPrompt = `${prompt.replace('{DL}', designLanguage)} Compose as a ${aspectHint[aspect] || aspect} image.`

  // The master reference is generated from text only; everything else attaches it as a visual pin.
  const useReference = id !== 'card-master-reference' && REFERENCE_DATA_URL
  const userContent = useReference
    ? [
        { type: 'text', text: `${REFERENCE_INSTRUCTION}\n\n${fullPrompt}` },
        { type: 'image_url', image_url: { url: REFERENCE_DATA_URL } },
      ]
    : fullPrompt

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aure.local',
          'X-Title': 'Aure prototype renders',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: userContent }],
          modalities: ['image', 'text'],
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
      const data = await res.json()
      const img = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
      if (!img) throw new Error(`No image in response: ${JSON.stringify(data).slice(0, 300)}`)
      const base64 = img.includes('base64,') ? img.split('base64,')[1] : null
      if (base64) {
        writeFileSync(outPath, Buffer.from(base64, 'base64'))
      } else {
        // Some models return a hosted URL instead of a data URI
        const bin = await (await fetch(img)).arrayBuffer()
        writeFileSync(outPath, Buffer.from(bin))
      }
      return console.log(`done   ${id} -> public/renders/${id}.png`)
    } catch (err) {
      console.warn(`retry  ${id} (attempt ${attempt}/3): ${err.message}`)
      if (attempt === 3) console.error(`FAILED ${id}`)
      else await new Promise(r => setTimeout(r, 2500 * attempt))
    }
  }
}

const queue = argIds.length ? images.filter(i => argIds.includes(i.id)) : images
console.log(`Model: ${MODEL} — generating ${queue.length} image(s)…`)
for (const item of queue) await generate(item) // sequential: image models rate-limit hard
