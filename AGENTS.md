# AGENTS.md — Development Guidelines & Coding Rules

> **Project:** Study Video AI — Autonomous STEM Educational Video Engine  
> **Developer:** Pallab Kumar Sarker  
> **Role:** Full-Stack TypeScript Engineer  
> **Port:** 3850 (Mandatory)

---

## 1. Zero AI Noise & Anti-Patterns (STRICT MANDATE)

When generating, modifying, or reviewing code:
1. **NO Emojis in Code:** NEVER include decorative emojis in code comments, JSDoc, commit messages, or terminal logs. Code must remain clean, professional, and terse.
2. **NO Multiline `/** ... */` AI Comments:** NEVER write artificial JSDoc blocks, verbose multi-line docstrings, or repetitive `@param` / `@returns` headers. If a comment is strictly necessary, use a concise, single-line `//` comment explaining non-obvious business logic or technical edge cases.
3. **NO Redundant / Fluff Comments:** NEVER write comments that merely rephrase what the code is doing.
4. **NO Half-Baked Placeholders:** NEVER output `// TODO: implement later` or `// ... rest of code`. Provide complete, syntactically valid code.
5. **Tooling Respect (Biome):** Use **Biome** (`@biomejs/biome`) for linting and formatting. Run `npm run check`.
6. **Utils in Kebab-Case:** Name utility/helper files strictly in **kebab-case** (e.g., `scene-optics.ts`, `video-renderer.ts`, `key-manager.ts`).

---

## 2. Scientific & Physics Engine Standards

1. **Exact Mathematical Geometric Convergence:**
   - In geometrical optics scenes (`scene-optics.ts`), all light rays must follow physical laws.
   - For convex and concave lenses, Ray 1 (parallel ray), Ray 2 (optical center ray), and Ray 3 (focal ray) MUST mathematically intersect at the exact computed pixel $(x_i, y_i)$ derived from the thin-lens equation $\frac{1}{d_i} = \frac{1}{f} - \frac{1}{d_o}$.
   - An animated focal beacon and glowing crosshair must pulse at the common collision point when rays arrive.
2. **Procedural Vector Animations:**
   - Visual scenes render at 24 FPS directly in memory via SVG and Sharp, piped to FFmpeg `stdin` (`image2pipe`).
   - Never write hundreds of temporary PNG files to disk.

---

## 3. Autonomous Generation Workflow

- Antigravity has full ownership of video creation.
- When the user asks for a video, Antigravity plans, animates, synthesizes, and compiles the video directly via CLI:
  ```bash
  npm run generate -- --prompt "<topic>" --title "<title>" --lang bn
  ```
- The web UI running at `http://localhost:3850/` serves as the real-time player, segment inspector, archive manager, and API quota dashboard.
- Default to **Google Gemini Kore** (`gemini-kore`) for speech narration.
- Default to **Gemini 3.5 Flash Lite** for high-volume free tier generations (1,500 RPD) to avoid the 20 RPD ceiling on `gemini-3.8-flash`.

---

## 4. Porting to Another PC

When setting up this project on another computer:
1. Ensure **Node.js 20+** and **FFmpeg** (added to system PATH) are installed.
2. Clone repository: `git clone https://github.com/PallabKumarS/study-video-ai.git`.
3. Run `npm install`.
4. Copy `.env` with a valid `GEMINI_API_KEY`.
5. Start web server: `npm run build && npm run start` on port 3850.
6. Antigravity will automatically load `.agents/skills/study-video-creator/SKILL.md` and `AGENTS.md`.
