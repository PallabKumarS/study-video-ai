# Study Video AI — Architecture & Porting Guide

> **Project:** Study Video AI  
> **Repository:** https://github.com/PallabKumarS/study-video-ai.git  
> **Stack:** Next.js 16 (App Router), React 19, TypeScript 5+, Tailwind CSS v4, Biome, FFmpeg, Google Gemini API (`@google/genai`)  
> **Server Port:** `3850` (Mandatory)

---

## 1. System Architecture Overview

Study Video AI is an autonomous STEM educational video engine designed for pair programming with Google Antigravity. The AI agent acts as director, scriptwriter, mathematical animator, and video editor.

```
                    User Prompt / Topic
                             │
                             ▼
              ┌──────────────────────────────┐
              │      Antigravity Agent       │
              │  (Plans segments, scripts,   │
              │   mathematical coordinates)  │
              └──────────────┬───────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│ Procedural Vector Engine│       │ Gemini Kore Voiceover   │
│ (24 FPS in-memory SVG/  │       │ (gemini-3.8-flash-lite- │
│  Sharp rasterization)   │       │  tts high-fidelity)     │
└───────────┬─────────────┘       └───────────┬─────────────┘
            │                                 │
            └────────────────┬────────────────┘
                             │ In-memory pipe stream
                             ▼
              ┌──────────────────────────────┐
              │      FFmpeg Native Pipe      │
              │  (libx264 60+ FPS stitching, │
              │   audio mux, thumbnail gen)  │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │      Web Dashboard (3850)    │
              │  • Interactive Video Player  │
              │  • Segment Script Inspector  │
              │  • Archive Catalog & MP4 dl  │
              │  • API Key & Quota Monitor   │
              └──────────────────────────────┘
```

---

## 2. Core Subsystems

### A. Procedural 24 FPS Vector Animation Engine (`src/engine/animator/`)
- **Direct Pipe Streaming:** Rather than writing thousands of PNG frame images to disk, frames are generated as SVG strings in memory, rasterized to raw PNG buffers via `sharp`, and piped directly to FFmpeg `stdin` (`-f image2pipe -vcodec png`). This achieves **68+ FPS encoding speeds**.
- **Exact Geometric Ray Optics (`scene-optics.ts`):**
  - Uses the thin-lens equation $\frac{1}{d_i} = \frac{1}{f} - \frac{1}{d_o}$ to dynamically compute exact focal length, object position, image distance, and magnification.
  - **Ray 1 (Parallel Ray):** Travels parallel from object tip, hits the lens at $(c_x, axisY - h_o)$, refracts through focal point $F_2$, and reaches $P_{img} = (c_x + d_i, axisY + h_i)$.
  - **Ray 2 (Central Ray):** Passes through optical center $O = (c_x, axisY)$ without deviation straight to $P_{img}$.
  - **Ray 3 (Focal Ray):** Passes through front focus $F_1$, hits lens at $(c_x, axisY + h_i)$, emerges parallel to principal axis, and meets Rays 1 & 2 directly at $P_{img}$.
  - **Collision Flare:** A glowing focal ring and crosshair beacon pulse at the exact pixel where all 3 rays collide.
  - **Concave Lens:** Diverging rays trace back through virtual dashed lines intersecting at the upright virtual focal point.
- **Wave Physics (`scene-waves.ts`):** Harmonic sinusoidal wave propagation $y = A \sin(kx - \omega t)$, circular wavefront ripples, and barrier reflections.
- **Biological & Particle Physics (`scene-particles-bio.ts`):** Cell membrane lipid bilayers, rotating ATP synthase molecular rotors, photon packets ($h\nu$), and electron carriers ($e^-$).
- **3D Spatial Perspectives (`scene-3d-spatial.ts`):** True 3D perspective projection $(X, Y, Z) \to (x, y)$ with depth scaling, rotating orbital rings, and depth-shaded nodes.

### B. High-Fidelity Voiceover Synthesis (`src/engine/voiceover.ts`)
- **Google Gemini Kore (Default):** Synthesizes natural, academic lecture narration via Google GenAI audio models.
- **Quota Resilience:** Prioritizes `gemini-3.8-flash-lite-tts` and `gemini-3.1-flash-tts-preview` to prevent the 10 RPD free tier limit on older TTS models from exhausting.
- **Edge TTS Fallback:** Seamless regional male and female fallback options (Pradeep, Nabanita, Christopher, Jenny).

### C. Quota & Key Management (`src/engine/key-manager.ts`)
- **Default Free Tier:** Standard Google AI Studio keys default to **Free Tier (1,500 RPD)**.
- **20 RPD Ceiling Tracking:** `gemini-3.8-flash` has a hard 20 request/day ceiling on Free Tier. If exhausted, the system marks it as `Quota Exhausted` with `0 left` in red, and automatically falls back to `gemini-3.5-flash-lite` (1,500 RPD).
- **Per-Model Quota Breakdown:** Real-time monitoring for Gemini 3.8 Flash, Gemini 4.0 Argon, Gemini 3.5 Flash Lite, and Google Veo.

---

## 3. Step-by-Step Porting Guide (To Another PC)

Follow these exact steps to clone and run this project on another computer with Antigravity installed:

### Step 1: Install System Prerequisites
1. **Node.js 20+ or 22+:**
   - Windows: `winget install OpenJS.NodeJS.LTS`
   - macOS: `brew install node`
   - Linux: `sudo apt install nodejs npm`
2. **FFmpeg (Crucial):**
   - Windows: `winget install Gyan.FFmpeg`
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
   - Verify by running in terminal:
     ```bash
     ffmpeg -version
     ```
     Ensure `ffmpeg` is available in your system `PATH`.

### Step 2: Clone Repository
```bash
git clone https://github.com/PallabKumarS/study-video-ai.git
cd study-video-ai
```

### Step 3: Install NPM Dependencies
```bash
npm install
```

### Step 4: Configure API Key in `.env`
Create a `.env` file in the project root:
```env
GEMINI_API_KEY=AIzaSyYourGoogleAIStudioApiKeyHere
```
*(Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey)).*

### Step 5: Start the Web Dashboard
```bash
npm run build
npm run start
```
The server will start on [http://localhost:3850](http://localhost:3850).

---

## 4. How Antigravity Operates on the New PC

Because `.agents/skills/study-video-creator/SKILL.md`, `AGENTS.md`, and `GEMINI.md` are committed to the repository:

1. **Automatic Discovery:** As soon as the workspace is opened in Antigravity on the new computer, Antigravity reads the skill and rules automatically.
2. **Autonomous Video Creation:**
   - The user can simply ask Antigravity in chat:
     > *"Generate a study video about Newton's Third Law in Bengali"*
     > *"Make an educational reel explaining how lenses form images"*
   - Antigravity will execute:
     ```bash
     npm run generate -- --prompt "Topic prompt" --title "Title" --lang bn
     ```
   - The video is rendered and saved to `public/generated/<jobId>/master.mp4`.
3. **Web Management Console:**
   - Open [http://localhost:3850/](http://localhost:3850/) to watch the live progress, play generated videos, inspect segment scripts, and manage API keys.
   - Open [http://localhost:3850/archive](http://localhost:3850/archive) to search past videos and download MP4s.
   - Open [http://localhost:3850/keys](http://localhost:3850/keys) to monitor quota usage and active keys.
