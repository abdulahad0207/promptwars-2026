# 🎓 Campus Pulse

> **A responsive, student-first AI web app that turns messy WhatsApp group chats and emails into an actionable, prioritized campus schedule.**

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Google Gemini AI**. Ready for seamless deployment on **Vercel**.

---

## ✨ Features

### 1. 🤖 AI-Powered Announcement Extraction
- Paste messy, forwarded WhatsApp group messages, club posters, or professor emails.
- **Server-side API Route** (`/api/parse-announcement`):
  - Structured extraction using **Google Gemini**.
  - Extracts `title`, `date`, `time`, `venue`, `category`, `summary`, and `actionItem`.
  - **Input length limit**: strictly enforced (max 5,000 characters) with friendly client/server validation.
  - **Zero-secret client exposure**: Gemini API key is kept securely on the server via `process.env.GEMINI_API_KEY`.
  - **Graceful heuristic fallback**: If offline or if the key is not set, a smart local regex parser kicks in so the app remains fully functional.
  - **1-Click Interactive Demo Presets**: Includes sample templates (Urgent Lab Submission, ACM Hackathon & Pizza, Professor Reschedule Email, Basketball Trials, Library Pass) to test immediately without typing.

### 2. 🔍 Searchable, Filterable & Categorized List
- **Full-text search**: Instant search across titles, descriptions, venues, categories, and tags.
- **Category filters**: Academic & Exams, Clubs & Hackathons, Workshops & Career, Sports & Fitness, Social & Fests, Admin & Notices.
- **Urgency status tabs**: All, Needs Attention Today, Urgent (<48h), Upcoming, Expired.
- **Sorting modes**: Priority (Urgent first), Date (Nearest first), Date (Furthest first), Category (A-Z), Recently added.
- **View modes**: Responsive card grid or compact list view.
- **Client storage**: All items are persisted securely in the browser's `localStorage` (`campus_pulse_events_v1`).

### 3. ⏱️ Pure Date & Urgency Logic (Not AI) & "Needs Attention Today"
- Evaluates deadlines and dates using **pure deterministic math**:
  - **Needs Attention Today**: Event is scheduled for today and not yet expired. Highlighted in the top alert section with live pulsing indicators.
  - **Urgent**: Events happening today or within the next 48 hours.
  - **Upcoming**: Scheduled more than 48 hours ahead.
  - **Expired**: Past event date or past elapsed time today.
- **Calendar Exports**:
  - **1-Click Add to Google Calendar** URL generator.
  - **Download `.ics` file** for Apple Calendar, Outlook, and mobile devices.

### 4. ⚡ "What Do I Need To Know This Week?" AI Digest
- **Executive student briefing** generated via `/api/digest` powered by Gemini:
  - 🎯 **The Week at a Glance**: Vibe and workload intensity assessment.
  - 🚨 **Top 3 Non-Negotiables**: Must-attend events and critical deadlines.
  - 🗓️ **Day-by-Day Playbook**: Chronological breakdown.
  - ⚠️ **Clash & Crunch Alert**: Detects overlapping times or heavy bottleneck days.
  - ✅ **Quick Action Checklist**: Practical preparation items.
- **Accessibility & Convenience**:
  - Built-in **"Read Aloud"** narration using the Web Speech API (listen to your week while walking across campus!).
  - "Copy Briefing" to clipboard.

### 5. ♿ Accessible, Keyboard-Friendly UI
- **Zero-instruction usability**: Interactive welcome banner and intuitive empty states.
- **Keyboard Shortcuts**:
  - `N` or `+`: Paste Announcement
  - `W`: Open Weekly AI Briefing
  - `/` or `Ctrl+K`: Jump to search
  - `Esc`: Close any active modal
  - `?`: Open keyboard shortcuts cheatsheet
- Semantic HTML (`<main>`, `<header>`, `<article>`, `<section>`), ARIA live regions, and high-contrast focus rings.

---

## 🧪 Unit Tests

Deterministic date and priority logic is covered by unit tests using **Vitest**:
- Start-of-day normalization (YYYY-MM-DD, ISO, invalid strings).
- 12-hour (AM/PM) and 24-hour time parsing.
- Same-day urgency and time-of-day expiration with grace periods.
- 24-48h urgent window classification.
- Multi-day upcoming and past expiration logic.
- "Needs Attention Today" filter accuracy.
- Sorting modes (Priority, Nearest, Furthest, Category, Pinned items).
- Google Calendar and `.ics` generation.

Run the test suite:
```bash
npm test
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **npm** or **pnpm**

### 2. Setup Environment
Copy the example environment file:
```bash
cp .env.example .env.local
```
Add your Google Gemini API Key in `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: `.env`, `.env.local`, and `.env*.local` are strictly excluded in `.gitignore` to prevent committing secrets).*

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## ☁️ Deploy on Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project in [Vercel](https://vercel.com/new).
3. In the project settings, add the Environment Variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
4. Deploy! Next.js will automatically build and deploy the app.
