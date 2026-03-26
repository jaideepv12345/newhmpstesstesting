# SOPSentinel — HMP Stress-Test Engine

## Vercel Deployment Instructions

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to this folder
cd sopsentinel-vercel

# Deploy
vercel

# For production deployment
vercel --prod
```

### Option 2: Vercel Dashboard
1. Go to https://vercel.com/new
2. Import this folder as a Git repository (push to GitHub first) or drag & drop
3. Framework Preset: Select "Other"
4. Build Command: `npm run build`
5. Output Directory: `dist/public`
6. Install Command: `npm install`
7. Click Deploy

### Option 3: GitHub Integration
1. Push this folder to a GitHub repository
2. Go to https://vercel.com/new
3. Import the GitHub repository
4. Vercel will auto-detect the settings from vercel.json
5. Click Deploy

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Express.js + SQLite (better-sqlite3) + Drizzle ORM
- **Analysis Engine**: 990-line stress-test engine with 5 analysis levels
- **PDF Generation**: jsPDF + jspdf-autotable (client-side)

## Features
- Upload HMP PDFs up to 500 pages
- 5-Level Stress Test (Compliance, Analytical, Implementation, Scenario, Equity)
- FEMA 44 CFR §201.6 compliance crosswalk
- Grant matching (BRIC, FMA, HMGP)
- Interactive dashboard with charts and visualizations
- Downloadable PDF report
- Dark/Light mode (NIMS briefing style)

## Environment
No external API keys required. The app runs entirely self-contained with:
- PDF parsing via pdf-parse
- Heuristic text analysis engine (no LLM dependency)
- SQLite database (auto-created)
- Client-side PDF report generation
