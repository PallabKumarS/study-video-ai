# StudyVideo AI

Autonomous AI-powered educational video and study reel generator built with Next.js 16 (App Router), React 19, TypeScript, Google Gemini API (`@google/genai`), FFmpeg, and Electron.

---

## Overview

StudyVideo AI transforms educational topics, lecture notes, and study prompts into cinematic, multi-segment vertical (9:16) and landscape (16:9) study reels with high-clarity voice narration, dynamic concept cards, and fluid motion graphics.

The system is completely topic-agnostic—generating educational videos across science, mathematics, engineering admission, biology, and humanities with zero hardcoded procedural drawing templates.

---

## Core Capabilities

- **Topic-Agnostic Generation Pipeline:** Input any academic prompt or topic. Gemini generates a structured multi-segment storyboard, narration script, badge metadata, concept takeaways, and pacing.
- **Concurrent Video Queue:** Create multiple study videos in parallel without blocking the workspace. Stacked floating widgets track live percentage, elapsed time counters, and dynamic remaining time estimates for each creation.
- **AI Academic Studio Voiceover:** Default studio narration powered by Gemini Kore (AI Academic), with support for Gemini Puck, Gemini Charon, and regional neural voices.
- **Bilingual Content Engine:** First-class support for natural educational Bengali (`bn`) and English (`en`), with bundled OpenType typography (Hind Siliguri and Nirmala UI) rendered through HarfBuzz.
- **Segment Studio & Revision Inspector:** Review individual video segments, inspect narration scripts, submit targeted revision feedback, switch AI models per segment, regenerate, and restitch master reels seamlessly.
- **Gemini Key & Quota Manager:** Manage multiple Google AI Studio API keys, switch active keys in `.env`, test API latency, and monitor rolling 24-hour request quotas.
- **Desktop Ready:** Pre-configured Electron desktop wrapper (`electron/main.cjs`) for packaging as a native desktop utility.

---

## Technology Stack

- **Framework:** Next.js 16.4 (App Router, Server Actions, Route Handlers, SSR)
- **UI Library:** React 19, Tailwind CSS v4, Lucide React
- **Language & Tooling:** TypeScript 5+, Biome (`@biomejs/biome`)
- **AI Models & SDK:** Google GenAI SDK (`@google/genai`)
  - Planner Models: `gemini-3.8-flash` (default), `gemini-3.5-flash-lite`, `gemini-3.1-pro-preview`
  - Audio TTS Models: `gemini-3.8-flash-tts` (Kore, Puck, Charon)
  - Video Generation: `veo-3.1-generate-preview`, `veo-2.0-generate-001`
- **Video Composition:** FFmpeg (libx264, libharfbuzz, FreeType, AAC)
- **Desktop Runtime:** Electron 45

---

## Getting Started

### Prerequisites

- Node.js 20+ or 22+
- FFmpeg installed and available in your system `PATH`
- Google AI Studio API Key ([Get an API Key](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PallabKumarS/study-video-ai.git
   cd study-video-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY=your_google_ai_studio_api_key_here
   GEMINI_API_KEYS=your_primary_key_here,optional_backup_key_here
   ```

### Running the Application

- **Web Development Server (Port 3850):**
  ```bash
  npm run dev
  ```
  Open [http://localhost:3850](http://localhost:3850) in your browser.

- **Production Build & Start:**
  ```bash
  npm run build
  npm run start
  ```

- **Electron Desktop Application:**
  ```bash
  npm run electron:dev
  ```

- **Code Quality Check (Biome):**
  ```bash
  npm run check
  ```

---

## Project Structure

```
study-video-ai/
|-- assets/
|   `-- fonts/                 # Bundled typography (Hind Siliguri, Inter)
|-- electron/
|   `-- main.cjs               # Electron main process entrypoint
|-- public/
|   `-- generated/             # Local video jobs, segments, and audio
|-- src/
|   |-- actions/
|   |   `-- studio-actions.ts  # Next.js Server Actions (Cancel, Delete, Fetch)
|   |-- app/
|   |   |-- api/               # API routes (Generate, Status, Keys, Titles)
|   |   |-- archive/           # Video archive and library page
|   |   |-- keys/              # Gemini API Key & Rate Limit Manager
|   |   |-- layout.tsx         # Global layout with Container and Provider
|   |   `-- page.tsx           # Studio root page
|   |-- components/
|   |   |-- confirm-modal.tsx  # Accessible reusable confirmation modal
|   |   |-- container.tsx      # Responsive fluid layout container (90%/96%)
|   |   |-- generation-floating-widget.tsx # Stacked multi-video progress widget
|   |   |-- generator-form.tsx # Non-blocking video creation form
|   |   |-- header.tsx         # Studio navigation and status header
|   |   |-- segment-studio.tsx # Segment revision and restitching studio
|   |   `-- video-player.tsx   # Video playback with delete and download
|   |-- context/
|   |   `-- generation-context.tsx # Multi-job concurrent state manager
|   `-- engine/
|       |-- config.ts          # Resolutions, aspect ratios, model registry
|       |-- key-manager.ts     # Multi-key rotation and usage tracking
|       |-- pipeline.ts        # Orchestration pipeline and time estimator
|       |-- planner.ts         # Gemini AI storyboard planning prompt
|       |-- stitcher.ts        # FFmpeg video composition and master release
|       |-- themes.ts          # Academic visual themes configuration
|       |-- types.ts           # Core TypeScript data contracts
|       `-- voiceover.ts       # Gemini TTS and neural speech synthesis
|-- .env.example
|-- .gitignore
|-- biome.json
|-- package.json
`-- tsconfig.json
```

---

## License

ISC License. Developed by Pallab Kumar Sarker.
