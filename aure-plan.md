# Aure — End-to-End Execution Plan

**Product:** Aure modular AI audio pod (dictation / ambient / MagSafe call recording)
**Markets:** B2B (hospitals, legal, field service) + B2C (professionals, students, creators)
**Companion doc:** [aure-spec.md](aure-spec.md) — product spec, BOM, architecture
**Timeline:** ~40 weeks from kickoff to commercial launch, then ongoing scale.

---

## Master Timeline

```
                        W1–4   W5–8   W9–12  W13–16 W17–20 W21–28 W29–34 W35–40  W40+
Phase 0  Foundation     ██
Phase 1  PoC            ████
Phase 2  Firmware              ████
Phase 3  Mechanical                   ████
Phase 4  Cloud + App                         ████
Phase 5  Pilot + Beta                               ████
Phase 6  DFM + Certs                                       ████████
Phase 7  Production                                                 ██████
Phase 8  Launch (GTM)                                                      ██████
Phase 9  Scale                                                                    ═══>
```

Phases 1–5 are the engineering track detailed in the spec. Phases 0 and 6–9 are what
turns a working pilot into a business.

---

## Phase 0 — Foundation (Weeks 1–2, parallel with Phase 1)

**Objective:** Clear the legal and structural runway before money is spent on tooling.

- Trademark search + filing for "Aure" (India first: class 9 hardware, class 42 SaaS; then Madrid Protocol for export markets).
- Company/IP structure: ensure hardware designs, firmware, and cloud IP are assigned to the entity.
- Open a costed budget tracker (see Budget section) and a decision log.
- Confirm regulatory scope early — this changes the BOM: India needs **BIS CRS** registration for the device + battery, and **WPC ETA** approval for the Wi-Fi/BLE radio (using a pre-certified ESP32 module makes ETA self-declaratory — a strong reason to stay on module-based designs, not chip-down, for v1).
- **Positioning guardrail:** In B2B healthcare, Aure is a *documentation* device, not a medical device — it captures dictation, it does not diagnose. Keep marketing language on that side of the line to stay out of CDSCO/FDA classification.

**Exit criteria:** Trademark filed, budget approved, certification checklist written.

---

## Phases 1–5 — Engineering Track (Weeks 1–20)

Detailed in [aure-spec.md](aure-spec.md) §6. Summary with exit criteria added:

| Phase | Weeks | Deliverable | Exit criteria (go/no-go) |
|---|---|---|---|
| 1. PoC | 1–4 | Breadboard: ESP32-S3 + dual INMP441 + piezo VCS | Clean audio to flash; **VCS picks up far-side call audio intelligibly on ≥2 of 3 test phones** — this is the highest-risk assumption in the product; kill or redesign call mode here if it fails |
| 2. Firmware | 5–8 | ESP-IDF: 3 capture modes, deep sleep, Wi-Fi upload loop, BLE sync, consent tone, policy flag | 48h battery standby; upload survives network drop; consent tone verified |
| 3. Mechanical | 9–12 | CAD + resin prints: pod, 3 docks, VCS coupling path, N52 cavity | Pod ≤10mm thick; magnet holds on phone through a case; VCS quality not degraded vs. breadboard |
| 4. Cloud + App | 13–16 | API gateway, Whisper+diarization pipeline, LLM structuring (B2B + B2C templates), admin console, B2C app alpha | End-to-end: speak → structured JSON in dashboard < 5 min; app syncs over BLE |
| 5. Pilot + Beta | 17–20 | 5–10 units in partner institution + 10–20 B2C beta units | Transcription accuracy ≥95% WER-adjusted on domain audio; NPS ≥40 from beta; legal review of call mode passed for pilot region |

**Build quantities:** Phase 1: 2–3 breadboards → Phase 3: 10 resin prototypes → Phase 5: 30 units (pilot + beta + spares), hand-assembled on SLS/resin shells and small-batch PCBA (JLCPCB/PCBWay class).

---

## Phase 6 — DFM + Certification (Weeks 21–28)

**Objective:** Convert the validated prototype into a manufacturable, certifiable product.

- **EVT → DVT:** Engineering validation (does the production design work?) then design validation (does it survive drop, sweat, 500 magnet cycles, thermal range?). Iterate the PCBA to a single main board; move from resin to **injection-molded shells** — this is the big tooling spend (₹8–15L for pod + dock molds; soft/aluminum tooling first to keep it at the low end).
- **Certifications (run in parallel, ~6–10 weeks):**
  - India: BIS CRS (device + LiPo cell under IS 16046), WPC ETA (self-declaratory with pre-certified radio module).
  - Battery transport: UN 38.3 (required to ship anything with LiPo).
  - Export (phase after India launch, but design for it now): FCC (US), CE-RED (EU).
- **Supply chain:** Second-source the INMP441, VCS piezo, and LiPo. Lock MOQ pricing: at 1k units the Lite BOM should fall from ₹1,890 toward ₹1,500–1,600.
- **B2C app hardening:** iOS + Android app to public-beta quality; App Store / Play Store review dry run (call-recording apps get extra scrutiny — the app never records; the *device* does, and the app only syncs files; make that architecture explicit in the review notes).

**Exit criteria:** DVT passes, certifications filed, landed cost model signed off.

---

## Phase 7 — Production Pilot Run (Weeks 29–34)

**Objective:** Manufacture the first sellable batch and shake out the factory.

- **PVT run: 500–1,000 units** (mix: ~70% Lite / 30% Pro based on pilot demand signal).
- Assembly + QA jig: automated audio test (play reference tone, verify capture), VCS sensitivity test against a reference phone chassis, magnet pull-force check, Wi-Fi/BLE functional test, firmware flash + device provisioning (unique device certs for the cloud gateway).
- Packaging: retail box for B2C (pod + chosen dock bundle), bulk fleet packaging for B2B.
- Cloud load test at 1,000 concurrent devices; per-device cost model for transcription minutes (Whisper/Deepgram cost is the COGS of the subscription — meter it from day one).

**Exit criteria:** <3% factory defect rate, certified units in hand, cloud holds load.

---

## Phase 8 — Go-to-Market Launch (Weeks 35–40)

Two motions, sequenced deliberately — **B2B lighthouse first, B2C on its proof**:

### B2B (direct sales)
- Convert the Phase 5 pilot institution into a paying lighthouse customer + case study ("X hours of documentation saved per clinician per week").
- Target 3–5 design-partner accounts in one vertical first (recommend healthcare — dictation pain is highest and the SOAP pipeline is already built). Expand verticals only after repeatable onboarding.
- Pricing: hardware near cost + **per-seat SaaS** (₹400–600/user/month) — the margin lives in the subscription, and near-cost hardware lowers fleet-adoption friction.

### B2C (D2C + marketplaces)
- Launch mechanism: **pre-order/crowdfunding campaign** (validates demand, funds the second production run, generates PR) → own web store → Amazon.
- Pricing (anchored against Plaud Note ~$159): **Aure Lite ₹5,999–6,999**, **Aure Pro ₹9,999–11,999**; docks ₹299–599 as attach-rate accessories.
- Subscription: free tier (300 transcription min/month, basic summaries) → **Aure AI Pro ₹499/month** (unlimited-ish minutes, premium templates, call summaries, to-do extraction). Target ≥35% paid attach by month 6.
- Content: launch demo videos of the three modes, with the MagSafe call-capture demo as the hero (it's the most visually differentiated feature).

**Exit criteria:** first 500 units sold/deployed, subscription billing live, support pipeline (docs + ticketing) operational.

---

## Phase 9 — Scale (Week 40+)

- Second production run sized on launch velocity; negotiate BOM at 5k+ MOQ.
- Export certification (FCC/CE) and first international market.
- Roadmap SKUs from the spec: **Call Kit** (Bluetooth HFP variant), additional dock form factors (car mount, clip).
- On-device wake-word / VAD to cut cloud costs; evaluate on-device Whisper-tiny for offline draft transcripts.
- B2B: EHR marketplace integrations (Practo/HealthPlix in India; Epic/Cerner apps for export markets).

---

## Team (minimum viable, phases 1–8)

| Role | When | Notes |
|---|---|---|
| Embedded/firmware engineer | W1 | ESP-IDF, I2S, BLE — the critical hire |
| Hardware/electrical engineer | W1 | Can be same person as above early; splits at Phase 6 |
| Mechanical/industrial designer | W9 | Contract is fine for v1 |
| Backend/cloud engineer | W13 | Pipeline + admin console |
| Mobile engineer | W13 | B2C app (Flutter/React Native — one codebase) |
| DFM/manufacturing consultant | W21 | Contract; factory liaison |
| Founder-led sales (B2B) + growth (B2C) | W17+ | Don't hire sales before the lighthouse case study exists |

---

## Budget (to launch, ballpark)

| Bucket | Estimate (₹) | Notes |
|---|---|---|
| Prototyping (Phases 1–3) | 4–6L | Dev kits, sensors, 3D prints, small PCBA runs |
| Pilot batch (30 units) | 1.5–2L | Hand-assembled |
| Cloud + app dev (Phases 4–6) | 8–12L | Mostly people cost if contracted |
| Injection tooling | 8–15L | Pod + 3 docks; soft tooling first |
| Certifications | 6–10L | BIS + WPC + UN38.3; FCC/CE later adds 8–12L |
| PVT run (1,000 units) | 20–25L | ~₹1,700 landed avg + assembly/QA |
| Launch marketing | 5–10L | Video, crowdfunding assets, PR |
| Contingency (20%) | ~12L | Hardware always slips |
| **Total to launch** | **~₹65–90L (~$80–110k)** | Excludes full-time salaries |

## Unit Economics (steady state, illustrative)

| | Aure Lite B2C | Aure Pro B2C | B2B seat |
|---|---|---|---|
| Landed cost | ~₹1,600 | ~₹3,200 | hardware near cost |
| Price | ₹6,499 | ₹10,999 | ₹500/user/mo |
| Hardware gross margin | ~70% | ~65% | ~0–15% |
| Subscription (₹499/mo, ~₹80–120 cloud COGS) | ~75–85% margin | ~75–85% | ~75–85% |

The business is a **subscription business with a hardware wedge**. Every decision (near-cost B2B hardware, free-tier minutes, template quality) should optimize for recurring-revenue attach.

---

## Top Risks & Mitigations

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| 1 | **VCS call-capture quality varies by phone chassis** (the Plaud-class mechanism is physics-dependent) | High | Phase 1 go/no-go on 3 phones; per-model gain profiles in firmware; speakerphone mode as universal fallback |
| 2 | Call-recording legal exposure in a launch region | Medium | Consent tone + locale gating already in spec; legal review is a Phase 5 exit criterion; B2B kill-switch preserves a no-call SKU |
| 3 | App-store rejection over call recording | Medium | Device records, app only syncs — document this in review notes; app contains no call-audio APIs |
| 4 | Tooling respin (mechanical fit/acoustics fail in molded parts) | Medium | Soft tooling first; acoustic + VCS test is part of EVT, not discovered at PVT |
| 5 | Cloud transcription COGS eats subscription margin | Medium | Meter per-device from day 1; batch processing; evaluate self-hosted Whisper at scale |
| 6 | BIS/WPC delays gate launch | Medium | File at week 21, not after PVT; use pre-certified radio modules |
| 7 | Plaud/competitors ship a multi-dock device | Low-Med | Aure's moat is the modular dock system + B2B pipeline, not the pod alone — ship the ecosystem story |

---

## KPIs by Phase

- **Phase 1:** VCS intelligibility score on 3 phones (go/no-go)
- **Phase 5:** transcription accuracy ≥95%, pilot NPS ≥40, battery ≥1 workday real use
- **Phase 7:** factory defect <3%, landed cost within 10% of model
- **Phase 8:** 500 units moved, ≥25% B2C subscription attach at day 30, 1 signed B2B lighthouse
- **Phase 9:** subscription MRR growth, B2B seat expansion rate, hardware margin at 5k MOQ
