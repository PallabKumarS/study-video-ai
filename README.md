# Study Video AI

Autonomous STEM educational study video engine built with Next.js 16 (App Router), React 19, TypeScript 5+, Tailwind CSS v4, Google Gemini API (`@google/genai`), procedural in-memory vector animation, and FFmpeg.

Designed for autonomous pair programming with **Google Antigravity**.

---

## Capabilities

- **Autonomous Video Creation:** Instruct Antigravity directly in chat to plan, write narration scripts, compute geometric parameters, synthesize voiceover, render 24 FPS vector animations, and assemble final MP4s.
- **Exact Mathematical Optics Engine:** Geometrical ray tracing where all three classical rules (parallel ray, optical center ray, focal ray) mathematically converge to the identical pixel collision point derived from the thin-lens equation $\frac{1}{d_i} = \frac{1}{f} - \frac{1}{d_o}$.
- **Procedural Vector Animations:** 24 FPS vector rendering (ray optics, wave mechanics, biological cell processes, 3D spatial perspectives) streamed directly in-memory from Sharp to FFmpeg `stdin` (`image2pipe`) at 68+ FPS without writing temporary PNG files to disk.
- **Google Gemini Kore Voiceover:** Authentic Google Gemini AI academic studio voice narration (`gemini-kore` via `gemini-3.8-flash-lite-tts`).
- **Bilingual Content Support:** Natural educational Bengali (`bn`) and English (`en`) with bundled OpenType typography (Hind Siliguri, Nirmala UI) rendered cleanly through HarfBuzz.
- **Quota & Key Management:** Real-time quota breakdown for Gemini 3.8 Flash (20 RPD free tier ceiling), Gemini 4.0 Argon, Gemini 3.5 Flash Lite (1,500 RPD), and Google Veo. Automatic fallback ensures zero failed creations.
- **Web Management Dashboard:** Video player, segment script inspector, archive catalog, and key manager running on port `3850`.

---

## Tech Stack

- **Framework:** Next.js 16.4 (App Router, Server Actions, Route Handlers, SSR)
- **UI & Styling:** React 19, Tailwind CSS v4, Lucide React, Sonner
- **Language & Tooling:** TypeScript 5+, Biome (`@biomejs/biome`)
- **AI Models & SDK:** Google GenAI SDK (`@google/genai`)
  - Planner & Scripting: `gemini-3.5-flash-lite` (1,500 RPD), `gemini-3.8-flash` (20 RPD), `gemini-3.1-pro-preview`
  - Audio TTS: `gemini-3.8-flash-lite-tts`, `gemini-3.1-flash-tts-preview`
- **Animation & Encoding:** Sharp (SVG to in-memory PNG), FFmpeg (native `image2pipe` streaming, libx264, AAC)
- **Desktop Ready:** Pre-configured Electron wrapper (`electron/main.cjs`)

---

## Getting Started

### Prerequisites

1. **Node.js 20+ or 22+**
2. **FFmpeg** installed and accessible in your system `PATH`
3. **Google AI Studio API Key** ([Get a free key](https://aistudio.google.com/app/apikey))

### Quick Installation

```bash
# 1. Clone the repository
git clone https://github.com/PallabKumarS/study-video-ai.git
cd study-video-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create a .env file with your Gemini API key:
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

### Running the Project

```bash
# Start the web management dashboard on port 3850
npm run build
npm run start

# Or for local development with hot reload:
npm run dev

# Generate a video directly via CLI:
npm run generate -- --prompt "Optics: Concave & Convex Lens Rules" --title "Lenses Explained" --lang bn
```

---

## Generating Videos with Antigravity

When working with Antigravity, you do not need to fill out forms manually. Simply ask in chat:

```
"Generate an educational study video explaining how concave and convex lenses refract light with ray diagrams in Bengali"
```

Antigravity executes the creation pipeline, logs step-by-step progress, and returns direct links to the generated MP4 file and the web player.

---

## Web Dashboard Pages (Port 3850)

- `/`: Studio page with active video player, detailed segment script inspector, and real-time generation progress.
- `/archive`: Searchable video library with MP4 downloads and segment breakdowns.
- `/keys`: Gemini API key manager, latency verification, and rolling daily quota breakdown per model.

---

## Porting to Another PC

Refer to [PORTING_AND_ARCHITECTURE.md](./PORTING_AND_ARCHITECTURE.md) for the complete, step-by-step setup guide on any machine running Google Antigravity.
