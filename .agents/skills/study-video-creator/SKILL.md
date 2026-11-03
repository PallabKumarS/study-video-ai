---
name: study-video-creator
description: Autonomous engine and workflow for generating animated 2D/3D STEM educational study videos with exact mathematical ray tracing, wave physics, bio simulations, Google Gemini Kore AI voiceover, and FFmpeg assembly.
---

# Study Video Creator — Agent Skill

This skill guides Antigravity in generating, animating, rendering, and managing educational STEM study videos directly inside this workspace.

## 1. Operating Philosophy

- **Zero User Burden:** When the user requests a study video in chat, Antigravity takes full ownership: planning the pedagogical segments, writing natural educational narration, designing exact mathematical diagram parameters, generating voiceover audio, rendering 24 FPS vector animations, and assembling the final MP4.
- **Scientific & Geometric Accuracy:** All scientific diagrams must adhere to physical laws. For ray optics, all 3 classical rays must converge to the exact mathematically computed collision pixel $P_{img} = (c_x + d_i, axisY + h_i)$ based on the thin-lens equation $\frac{1}{d_i} = \frac{1}{f} - \frac{1}{d_o}$.
- **Zero AI Clutter:** Clean, professional code and logs with zero decorative emojis, zero multiline AI docstrings, and strict kebab-case utility files.

## 2. Video Creation Workflow

When a video generation request is received:

1. **Formulate Educational Concept & Title:**
   - Detect language: Bengali (`bn`) by default for Bengali prompts, English (`en`) for English prompts.
   - For Bengali, generate authentic educational Bengali text without transliteration artifacts.
2. **Execute Generation via CLI Script:**
   ```bash
   npm run generate -- --prompt "Topic and core concept explanation" --title "Educational Title" --lang bn --model gemini-3.5-flash-lite
   ```
3. **Pipeline Stages Handled Internally:**
   - `planning`: Generates structured segments with visual prompts, layout types, and narration scripts.
   - `audio`: Synthesizes authentic Google Gemini Kore speech (`models/gemini-3.8-flash-lite-tts`).
   - `rendering`: Streams multi-frame procedural vector PNGs in-memory directly to FFmpeg `stdin` (`image2pipe`) at ~70 FPS without saving temporary frame files to disk.
   - `stitching`: Concat-encodes all segments, overlays narration audio, generates master thumbnail, and updates `key_usage.json` and `history.json`.
4. **Present Output to User:**
   - Provide direct file link to `public/generated/<jobId>/master.mp4`.
   - Provide web link to [http://localhost:3850/](http://localhost:3850/) for interactive playback, segment inspection, and archive download.

## 3. Server Management & Verification

- The local Next.js web dashboard runs strictly on **port 3850**:
  ```bash
  npm run start
  # or in development:
  npm run dev
  ```
- Web endpoints:
  - `/`: Video Studio, live creation progress, active player, and segment inspector.
  - `/archive`: Searchable catalog of all past releases with MP4 downloads and segment breakdowns.
  - `/keys`: Gemini API key manager, rate limit inspector, and per-model quota tracking (Gemini 3.8 Flash 20 RPD free tier vs 1,500 RPD 3.5 Flash Lite).

## 4. Quota & Model Fallback Rules

- Google AI Studio Free Tier allows strictly **20 Requests/Day** on `gemini-3.8-flash`.
- If a 429 quota exhaustion is detected, the engine automatically switches to `gemini-3.5-flash-lite` (1,500 RPD) and records the fallback reason in video metadata and UI cards.
