# Project "Aure" — Modular AI Audio Dictation & Call Recording System

A modular, multi-form-factor hardware-to-software solution for hands-free, automated documentation — serving **enterprise (B2B)** deployments in hospitals, legal consultancies, and field engineering, and **consumer (B2C)** users such as journalists, students, sales professionals, and creators.

By decoupling the recording core from its physical mount, users seamlessly transition the device from a wristwatch to a lanyard pendant, snap it to a workstation desk, or attach it directly to the back of a MagSafe-compatible smartphone for call recording — all using the built-in magnetic array.

---

## 1. Product Conception & Value Proposition

Traditional dictation forces professionals to hold a phone or dictate into static desktop software, and dedicated call recorders (Plaud Note, NotePin) only do one job. Aure is a single pod that does all of it.

- **Universal Capture Modes (Dictation / Ambient / Call):** Aure is a fully multi-purpose recorder. The same pod handles solo dictation, ambient meeting capture, and telephone call recording. In B2B deployments, call capture is policy-gated: organizations that don't want it disable it fleet-wide at the firmware level (zero-liability posture), while organizations that need it (sales teams, telehealth, legal intake) enable it with built-in compliance guardrails — audible recording tone, per-region consent prompts, and tamper-evident audit logs. B2C users control modes directly from the companion app.
- **MagSafe Call Recording (Plaud-class):** The pod's N52 magnetic ring snaps it flush to the back of any MagSafe-compatible phone. A vibration conduction sensor (VCS) picks up the far-side caller's voice through the phone chassis during a normal earpiece call — no speakerphone, no app-level intercept, no jailbreak. Combined with the MEMS mics capturing the user's own voice, both call legs are recorded cleanly.
- **No Intercept Circuits, No Platform Bans:** Call capture is purely acoustic/vibrational — the device never touches the cellular audio path or the phone's OS. This is the same architecture that lets Plaud-class devices ship globally without carrier or app-store friction.
- **Smartphone Optional:** Core dictation and ambient modes require no smartphone; Wi-Fi upload is fully standalone. Call-capture mode interoperates with any phone acoustically/vibrationally (or via Bluetooth pairing on the Call Kit variant) without ever joining the phone to a corporate network. B2C users may pair the app over BLE for on-the-go sync; B2B fleets stay app-free.
- **Dual-Tier Hardware Strategy:**
  - **Aure Lite (Headless):** A pure, distraction-free voice terminal for high-volume B2B deployments and price-sensitive B2C buyers.
  - **Aure Pro (Display):** Glanceable 1.28" circular screen for real-time status, mode indication (dictation / ambient / call), sync confirmation, and battery alerts.

---

## 2. Multi-Tiered Bill of Materials

The architecture isolates the core computing capsule from its structural mounts. Enterprise clients buy a fleet of standardized pods and distribute mounting accessories by workflow; consumers pick the mounts that fit their life.

```
                  ┌─────────────────────────────────────────┐
                  │           CORE POD ARCHITECTURE          │
                  │ (ESP32-S3, Dual MEMS Mics, VCS, N52 Ring)│
                  └────────────────────┬─────────────────────┘
                                       │
        ┌──────────────────┬───────────┴────────┬─────────────────────┐
        ▼                  ▼                    ▼                     ▼
┌───────────────┐  ┌───────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Wrist Dock   │  │ Pendant Dock  │  │    Desk Mount    │  │  MagSafe Direct  │
│(Smartwatch    │  │(Lanyard Mode) │  │(Stationary Mode) │  │(Phone-Back Call  │
│ Mode)         │  │               │  │                  │  │ Recording Mode)  │
└───────────────┘  └───────────────┘  └──────────────────┘  └──────────────────┘
```

### Core Hardware Pricing

| Component | Aure Lite (Headless) | Aure Pro (1.28" Display) | Component Functional Role |
|---|---|---|---|
| Processor | ₹750 (XIAO ESP32-S3) | ₹1,200 (ESP32-S3 WROOM) | Main CPU: Wi-Fi, BLE, and audio I2S pipelines. |
| Display Panel | ₹0 (None / 3x Status LEDs) | ₹1,000 (GC9A01 1.28" Circular LCD) | User interface, system states, mode + sync indicators. |
| Acoustic Array | ₹350 (Dual INMP441 MEMS) | ₹350 (Dual INMP441 MEMS) | Spatial noise isolation via dual-channel beamforming; captures near-side voice in all modes. |
| Vibration Conduction Sensor | ₹220 (Piezo VCS module) | ₹220 (Piezo VCS module) | Picks up far-side caller audio through the phone chassis in MagSafe call mode (Plaud-class capture). |
| Storage Unit | ₹100 (16MB On-Board Flash) | ₹350 (MicroSD Slot + Card) | Buffers raw audio locally when Wi-Fi is unavailable. |
| Power Storage | ₹250 (250mAh Flat LiPo) | ₹380 (400mAh Circular LiPo) | Rechargeable internal battery. |
| Magnetic Array | ₹120 (N52 MagSafe Ring) | ₹120 (N52 MagSafe Ring) | MagSafe-compatible alignment: hot-swaps between docks AND snaps directly to phone backs for call mode. |
| Shell Housing | ₹100 (3D Printed Resin Pod) | ₹120 (3D Printed Resin Pod) | Fluid-resistant, impact-resistant frame; rigid coupling path for the VCS. |
| **Total BOM** | **~₹1,890 ($23 USD)** | **~₹3,740 ($45 USD)** | Excludes variable external structural docks. |

### Modular Accessory Docks (Priced Individually)

- **The Wrist Dock: ₹200.** Flexible silicone or medical-grade fluoroelastomer watch strap with a central stainless steel anchoring washer.
- **The Pendant Dock: ₹120.** Form-fitting silicone sleeve with an anti-microbial breakaway nylon neck lanyard.
- **The Workstation Dock: ₹100.** Surface-mount magnetic bracket with industrial adhesive for desks, medical carts, or non-MagSafe smartphones.
- **MagSafe Direct: ₹0.** No accessory required — the pod's built-in N52 ring snaps straight onto MagSafe-compatible phones (iPhone 12+, MagSafe-case Android). The Workstation Dock's adhesive bracket covers phones without MagSafe.

### Hardware Variant: Aure Pro "Call Kit" (Roadmap SKU)

For enterprises needing full-fidelity digital call audio, a Pro variant swaps the ESP32-S3 for a dual-mode Bluetooth module (e.g., ESP32-WROOM-32E with Bluetooth Classic HFP, +₹450–600 BOM). The pod registers as the phone's headset and captures both call legs digitally. Note: the standard ESP32-S3 is BLE-only and cannot do HFP — this is why the base product uses VCS + acoustic capture, which needs no pairing at all.

---

## 3. Capture Modes & Call Recording Architecture

| Mode | How it works | Hardware used |
|---|---|---|
| **Dictation** | User speaks directly to the pod (wrist, pendant, or desk). | MEMS beamforming array |
| **Ambient / Meeting** | Pod records the room; diarization separates speakers in the cloud. | MEMS beamforming array |
| **Call — MagSafe (default)** | Pod snaps to the phone back. VCS captures the far-side voice through chassis vibration; MEMS mics capture the user. Firmware mixes both channels. | VCS + MEMS array + N52 ring |
| **Call — Speakerphone** | Fallback for non-MagSafe phones on the adhesive bracket, or handset-on-desk scenarios. | MEMS beamforming array |
| **Call — Bluetooth HFP** | Call Kit variant only: pod acts as the phone's headset, capturing both legs digitally. | Dual-mode BT module |

### Compliance Guardrails (all call modes)

- Audible recording tone injected at recording start (admin-configurable interval per jurisdiction).
- Per-region consent policy flags provisioned at fleet setup (B2B) or set by locale in the app (B2C).
- Tamper-evident audit log of every recording session synced with the audio.
- Fleet-wide firmware kill-switch: B2B admins can disable call mode entirely, restoring the zero-call-liability posture for compliance-sensitive deployments.

---

## 4. Software Architecture & AI Pipeline

Local hardware compression + Wi-Fi/BLE routing offloads processing to cloud infrastructure, keeping the device thin and cheap.

```
┌──────────────┐             ┌──────────────┐             ┌─────────────────────┐
│   Core Pod   │  Raw Audio  │ Enterprise    │ Audio File  │  Secure Cloud S3    │
│  (Hardware)  ├────────────>│ Wi-Fi  — or — │────────────>│   (Data Bucket)     │
│              │ (Wi-Fi/BLE) │ B2C Phone App │   (HTTPS)   │                     │
└──────────────┘             └──────────────┘             └──────────┬──────────┘
                                                                     │
┌──────────────────┐         ┌──────────────┐                        │
│ B2B: Dashboard / │ Struct. │  Fine-Tuned  │   JSON Transcript      │
│ EHR System       ├<────────┤  LLM Parsing │<───────────────────────┘
│ B2C: Mobile App  │  Data   │ (GPT-4o/Llama)│  (+ speaker diarization)
└──────────────────┘         └──────────────┘
```

### The 4-Step Pipeline

1. **Local Capture:** Audio is encoded from the I2S MEMS mics (and the VCS channel in call mode) into a compressed format (16-bit Mono PCM or Opus) and written to local flash. In call mode, the VCS and MEMS channels are mixed with per-channel gain before encoding.
2. **Encrypted Secure Transfer:** On registering its designated Wi-Fi network (B2B) or syncing to the companion app over BLE (B2C), the device triggers a background upload loop, passing files via HTTPS POST into an encrypted cloud bucket (AWS S3 / Azure Blob).
3. **Language-Agnostic Transcription:** A cloud callback routes the file through speech-to-text (OpenAI Whisper Large-v3 or Deepgram Nova-2) with auto-detected multilingual input (mixed Hindi, English, Spanish). For call and meeting recordings, the pipeline additionally runs **speaker diarization**, labeling each transcript segment by speaker so downstream structuring can attribute statements to caller vs. callee.
4. **Semantic Structuring Engine:** The transcript passes to an LLM running tailored system prompts — enterprise templates (SOAP notes, legal intake, field reports) for B2B, and consumer templates (meeting summaries, call notes, to-do extraction, memos) for B2C.

### B2B System Prompt Framework (example: clinical)

```
System Prompt: You are an advanced enterprise medical document processor.
Analyze the input text transcript. Ignore background ambient chatter or interruptions.
If the transcript is a diarized call, attribute subjective statements to the correct
speaker and note the call context in each field.
Extract and classify the data into a standard structured JSON object formatting
clinical SOAP notes:
{
  "subjective": "Patient-reported symptoms, history, and current timeline",
  "objective": "Vital signs, physical examinations, and observable clinical metrics mentioned",
  "assessment": "Differential diagnoses, progress indicators, or medical interpretations",
  "plan": "Prescribed medications, dosage instructions, scheduling, and diagnostic orders"
}
Output strictly valid JSON. Do not include markdown wraps or conversational commentary.
```

---

## 5. Dual Go-to-Market: B2B + B2C

| | B2B (Enterprise) | B2C (Consumer) |
|---|---|---|
| **Distribution** | Fleet sales: standardized pods + accessory docks per workflow | D2C web store / marketplaces; pod + chosen dock bundles |
| **Connectivity** | Enterprise Wi-Fi, standalone, no personal phones on network | Companion app (BLE sync) + home Wi-Fi |
| **Software** | Dashboard / EHR / CRM integration, admin fleet policy console | Mobile app: library, summaries, search, export |
| **Call recording** | Admin policy-gated, audit-logged, kill-switchable | User-controlled with locale-based consent prompts |
| **Revenue** | Hardware + per-seat SaaS (transcription/structuring pipeline) | Hardware + freemium subscription (monthly transcription minutes, premium AI templates) |
| **Templates** | SOAP notes, legal intake, field service reports | Meeting notes, call summaries, to-dos, voice memos |

---

## 6. End-to-End Execution Plan

```
Phase 1: Proof of Concept (Weeks 1-4)      ████████
Phase 2: Firmware Development (Weeks 5-8)          ████████
Phase 3: Mechanical Design (Weeks 9-12)                    ████████
Phase 4: Software Integration (Weeks 13-16)                        ████████
Phase 5: Pilot & Beta (Weeks 17-20)                                        ████████
```

**Phase 1: Bench Prototype Proof of Concept (Weeks 1–4)**
Objective: Verify the electronic schematic, audio quality, and battery performance using open development boards.
Deliverable: Open-frame ESP32-S3 dev kit wired to dual INMP441 microphones AND a piezo VCS module on a breadboard. Validate raw audio writes cleanly to external memory, and bench-test VCS pickup quality against the back of 2–3 phone models during live earpiece calls.

**Phase 2: Core Firmware Implementation (Weeks 5–8)**
Objective: Build a low-power, stable operating system for the microcontroller using ESP-IDF.
Deliverable: Deep-sleep routines triggered by a tactile switch; I2S microphone drivers plus the VCS analog channel with per-channel gain mixing; automated background Wi-Fi scanning and HTTP upload loops; BLE sync protocol for the B2C app path. Implement the three capture modes (dictation / ambient / call) behind an admin-provisioned policy flag, plus the mandatory consent-tone generator for call mode.

**Phase 3: Mechanical Engineering & Industrial Design (Weeks 9–12)**
Objective: Design the thin, circular housing and multi-purpose mounts.
Deliverable: CAD the circular pod and matching docks. Factor in component clearances, acoustic paths for the mics, a rigid vibration-coupling path from the rear shell to the VCS (critical for call capture quality), and the cavity for the rear MagSafe-compatible N52 ring. Validate that the pod's magnet strength and thinness allow direct phone-back mounting without blocking wireless charging coils. Print the initial run in impact-resistant resin.

**Phase 4: Cloud Infrastructure & API Engineering (Weeks 13–16)**
Objective: Construct the secure cloud data processing pipeline for both markets.
Deliverable: API gateway authenticating device and app connections; processing logic passing audio to Whisper for transcription with diarization on multi-speaker recordings; LLM structuring with B2B and B2C template libraries; delivery to enterprise dashboards/EHR and to the consumer mobile app. Build the B2B admin console for fleet call-recording policy.

**Phase 5: Enterprise Pilot + Consumer Beta (Weeks 17–20)**
Objective: Deploy in live environments across both segments to gather operational data.
Deliverable: (a) B2B — pilot batch of 5–10 units in a partner institution (private clinic or field service depot); monitor transcription accuracy, magnetic mount durability, and LLM prompt performance. (b) B2C — closed beta of 10–20 units with app users; validate MagSafe call-capture quality across 3–5 common smartphone models (iPhone MagSafe + Android with magnetic cases), consent-tone and audit-log behavior against the pilot region's call-recording consent laws, and app sync reliability.

---

## Appendix: Legal Note on Call Recording

Call recording consent laws vary by jurisdiction (two-party consent in several US states; India distinguishes participant recording from telecom intercept). Aure's architecture is the defensible enterprise pattern — the *participant* records their own call, acoustically, with an audible tone and policy controls (the same posture as Zoom/Gong and shipping Plaud-class consumer devices). Phase 5 must include a legal review for each launch region, and B2C onboarding must surface local consent requirements before call mode is first enabled.
