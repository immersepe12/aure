# Aure — Feature Parity Spec (vs Pocket / HeyPocket)

Buyers cross-shop Aure against Pocket and Plaud. This is the checklist Aure must match
or beat. Source: Pocket's public product + pricing page (captured 2026-07).

## App / intelligence layer (must-have parity)
| Capability | Pocket | Aure status |
|---|---|---|
| Summaries (tailored) | ✓ | ✓ on site · build in app |
| Action items → task apps | ✓ | ✓ on site · build in app |
| Mind maps | ✓ | ✓ on site · build in app |
| Ask (chat with your notes) | ✓ "Ask Pocket" | "Ask Aure" — build |
| Speaker name auto-detection | ✓ (Pro) | diarization (WhisperX+pyannote) |
| Custom templates + regenerate | ✓ (Pro) | build — SOAP / site report / lecture |
| Model-agnostic (GPT/Claude/Gemini) | ✓ | ✓ our design |
| Exports: text → PDF → audio | ✓ | build |
| File attachments | ✓ (Pro) | build |
| Daily highlights + home widgets | ✓ (Pro) | build |
| Encrypted in transit & at rest | ✓ | required — must ship |
| Home dashboard (Meetings/Chats/Thoughts, calendar) | ✓ | build in app |

## Hardware spec parity
| Spec | Pocket | Aure |
|---|---|---|
| Microphones | 2 Studio + 1 Contact (calls, no speaker) | 2 MEMS + 1 contact/VCS — **parity, our core** |
| Languages | 120+ | 50+, **Indic-tuned (our moat)** |
| Storage | 64GB onboard + unlimited cloud | 30+ hrs onboard + unlimited cloud |
| Battery | 4 days active | full-day active · 4-day standby (verify vs BOM) |
| MagSafe | ✓ | ✓ |
| Range | up to 15m | up to 15m |
| Charging | 1.5h | ~1.5h |
| Interfaces | BLE / Wi-Fi / USB-C | BLE / Wi-Fi / USB-C — parity |
| Size/weight | 52g, 5mm | **~4mm card, lighter — our edge (wallet-thin)** |

## Plan structure (features only — PRICING NOT SET YET, per founder)
- **Free:** unlimited transcription (standard), Ask (limited/day), unlimited summaries
  (retained ~30 days), unlimited to-dos + integrations, mind maps, text export.
- **Pro:** everything in Free + summaries saved forever, highest-accuracy transcription,
  speaker names, unlimited Ask, best models, daily highlights + widgets, custom templates
  + regeneration, advanced integrations, file attachments, mind-map + full/audio exports.
- Aure adds a **Teams/org tier** Pocket has no answer for: roll-ups, hierarchy dashboards,
  EMR/site-tool autofill (Chrome extension), admin policy + audit.

> ⚠️ Pricing numbers are deliberately unset — founder decides. Do not put tier prices on the
> site until then. The ₹3,999 launch price stands as-is.

## Where Aure wins (lead with these)
1. **Indic accuracy** — Hindi/Kannada/Tamil/code-switching (Pocket & Plaud are weak here).
2. **B2B org intelligence** — hierarchy roll-ups + dashboards; Pocket has no team story.
3. **Thinner, wallet-native** card form factor.
4. **Vertical depth** — healthcare & construction templates and workflows out of the box.
5. **Extension autofill** into existing EMR/CRM/site tools.
