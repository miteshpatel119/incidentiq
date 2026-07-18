# IncidentIQ — AI Incident Investigator & Smart RCA

**IncidentIQ** is a production-quality SaaS application for real-time incident monitoring, AI-powered root cause analysis (RCA), and post-incident reporting. Built for Site Reliability Engineers (SREs), DevOps teams, and platform engineers who need to quickly identify, investigate, and resolve service incidents.

<a href="https://incidentiq-git-main-zarvis.vercel.app/dashboard" target="_blank">IncidentIQ Dashboard</a>

## Features

- **Real-time Incident Simulation** — Enterprise-grade incidents (database failure, API timeout, Kubernetes pod crash, deployment issue, SSL expiry, configuration change) stream in every 8–15 seconds.
- **AI-Powered Root Cause Analysis** — One-click investigation that collects logs, correlates metrics, inspects configurations, and queries an LLM (OpenRouter/OpenAI) for a structured RCA report.
- **Rich Investigation Results** — Animated investigation timeline, confidence meter, RCA cards, evidence view, code diff suggestions, configuration change suggestions, recommended recovery commands, and a downloadable post-incident report.
- **Professional UI** — Dark mode, responsive layout, interactive incident table with severity badges, real-time monitoring connection status, and polished SaaS styling inspired by Vercel, Linear, and Datadog.
- **Enterprise Mock Data** — Realistic, internally consistent mock data for each incident: application logs, server logs, deployment history, configuration changes, metrics (CPU, memory, disk), Kubernetes events, and business impact.

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Frontend (Vite + React)         │
│  ┌─────────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ Auth (Mock)  │ │Incident   │ │ RCA Result   │  │
│  │ admin/admin  │ │Dashboard  │ │ Viewer       │  │
│  └─────────────┘ └───────────┘ └──────────────┘  │
│         │              │               │          │
│         └──────────────┼───────────────┘          │
│                        │ HTTP POST /api/analyze    │
└────────────────────────┼──────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────┐
│            Vercel Serverless Functions             │
│  ┌─────────────────────▼──────────────────────┐   │
│  │           /api/analyze.ts                  │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │  /api/lib/openrouterAnalysis.ts     │   │   │
│  │  │  → Collects enterprise data         │   │   │
│  │  │  → Constructs structured prompt      │   │   │
│  │  │  → Calls OpenRouter API (LLM)       │   │   │
│  │  │  → Normalizes & validates response  │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │           /api/health.ts                   │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### Tech Stack

| Layer                  | Technology                                               |
| ---------------------- | -------------------------------------------------------- |
| **Frontend**           | React 18, TypeScript (strict mode), Vite 6               |
| **Styling**            | Tailwind CSS 3, shadcn/ui components, lucide-react icons |
| **Routing**            | React Router v7                                          |
| **Serverless API**     | Vercel Functions (@vercel/node)                          |
| **LLM Provider**       | OpenRouter API (OpenAI, Claude, Gemini, etc.)            |
| **Package Manager**    | npm                                                      |
| **Linting/Formatting** | ESLint 9, Prettier 3                                     |

## Getting Started

### Prerequisites

- **Node.js** >= 20.x (see `.nvmrc` or `package.json` engines)
- **npm** >= 10.x
- **OpenRouter API Key** — [Get one free](https://openrouter.ai/keys)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/miteshpatel119/incidentiq.git
cd incidentiq

# 2. Install dependencies
npm ci

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your OpenRouter API key:
#   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**.

### Login

- **Username:** `admin`
- **Password:** `admin`

> This is a mock authentication layer for demo purposes only.

### Development Commands

| Command             | Description                           |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start Vite dev server (frontend only) |
| `npm run dev:full`  | Start Vite + API server locally       |
| `npm run build`     | Type-check and build for production   |
| `npm run preview`   | Preview production build locally      |
| `npm run lint`      | Run ESLint (zero warnings required)   |
| `npm run lint:fix`  | Auto-fix lint issues                  |
| `npm run format`    | Format code with Prettier             |
| `npm run typecheck` | TypeScript type checking              |
| `npm run check`     | Format check + lint + typecheck       |

## Deployment

### Deploy to Vercel (Free)

The easiest way to deploy IncidentIQ is on **Vercel's free tier**:

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/miteshpatel119/incidentiq.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework preset: **Vite** (auto-detected)
   - Root directory: `./` (default)
   - Build command: `npm run build` (auto-detected)
   - Output directory: `dist` (auto-detected)

3. **Set Environment Variables** (required):
   - `OPENROUTER_API_KEY` — Your OpenRouter API key
   - `NODE_ENV` — `production` (set automatically by Vercel)

4. **Deploy** → Click "Deploy"

Your app will be live at `https://incidentiq.vercel.app` (custom domain supported).

### Environment Variables

| Variable             | Required | Description                               |
| -------------------- | -------- | ----------------------------------------- |
| `OPENROUTER_API_KEY` | ✅ Yes   | API key for AI-powered RCA via OpenRouter |
| `NODE_ENV`           | ❌ No    | Set to `production` on Vercel (auto)      |
| `PUBLIC_URL`         | ❌ No    | Application URL for redirects             |

> **⚠️ Security:** Never commit your real `OPENROUTER_API_KEY` to version control. Always use Vercel's Environment Variables dashboard for production secrets.

## CI/CD

This project includes a GitHub Actions workflow for continuous integration:

```yaml
# .github/workflows/ci.yml
- Lint and format check
- TypeScript type checking
- Production build verification
```

To add a deployment workflow, see the [Deployment Guide](./DEPLOYMENT.md).

## Project Structure

```
incidentiq/
├── api/                    # Vercel serverless functions
│   ├── analyze.ts          # AI analysis endpoint
│   ├── health.ts           # Health check endpoint
│   └── lib/
│       └── openrouterAnalysis.ts  # OpenRouter API client
├── src/
│   ├── app/
│   │   ├── App.tsx         # Root app component
│   │   └── routes.tsx      # Route definitions
│   ├── components/
│   │   ├── layout/         # AppLayout, Sidebar, UserMenu
│   │   └── ui/             # Button, Modal, StatusBadge, EmptyState
│   ├── features/
│   │   ├── auth/           # Login, AuthProvider, ProtectedRoute
│   │   ├── dashboard/      # DashboardPage
│   │   ├── incidents/      # Incident simulation, table, detail, RCA
│   │   ├── shared/         # ErrorBoundary, PlaceholderPage
│   │   └── theme/          # ThemeProvider (dark mode)
│   ├── lib/
│   │   └── utils.ts        # Utility functions
│   └── styles/
│       └── globals.css     # Tailwind imports + global styles
├── .env.example            # Environment variable template
├── vercel.json             # Vercel deployment config
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## 🤖 AI-Assisted Development

This project was developed with the assistance of multiple AI models during different phases of development. AI was used to help with prompt refinement, code generation, debugging, testing, documentation, and code quality improvements. All generated code was reviewed, tested, and integrated by the project author.

| AI Tool | Model             | Primary Usage                                                                                                                          |
| ------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| ChatGPT | GPT-5.5           | Generate concise implementation prompts and refine development tasks.                                                                  |
| Codex   | GPT-5.5 Medium    | Generate implementation code for prompts **#1–#5**.                                                                                    |
| Cline   | DeepSeek V4 Flash | Generate implementation code for prompts **#6–#7**.                                                                                    |
| Cline   | Stepfun 3.7 Flash | Resolve OpenAI API and Gemini API integration issues (Prompt **#8**).                                                                  |
| Cline   | Stepfun 3.7 Flash | OpenRouter API integration, project setup, and code quality improvements (Prompts **#6–#8**).                                          |
| Cline   | Laguna M.1        | Code quality improvements, test case generation, UI/design refinements, and GitHub/Vercel deployment issue fixes (Prompts **#9–#10**). |

**Note:** AI tools were used as development assistants. Final implementation decisions, testing, code review, and integration were performed by the project author.

## How It Works

### 1. Incident Simulation

After login, the app simulates a monitoring system connection. Every 8–15 seconds, a new realistic enterprise incident is generated from predefined scenarios:

- **Database Failure** — Connection pool exhaustion, replica lag
- **API Timeout** — Upstream service degradation, throttling
- **Kubernetes CrashLoopBackOff** — Pod OOM, config mismatch
- **Deployment Failure** — Canary rollout issues, rollback events
- **SSL Certificate Expiry** — Certificate validation errors
- **Configuration Change** — Feature flag toggles, rate limit changes

### 2. Investigation

Click **Analyze** on any incident to start an AI investigation. The system:

1. Collects all enterprise data (logs, metrics, K8s events, deployments, etc.)
2. Constructs a structured prompt for the LLM
3. Sends a single request to OpenRouter API
4. Parses the JSON response into a structured RCA report

### 3. Root Cause Analysis Report

The investigation result includes:

- **Root Cause** — Plain-English description of the problem
- **Confidence Score** — 0–100% confidence meter
- **Timeline** — Animated sequence of investigation steps
- **Evidence** — Log snippets, metrics, events
- **Business Impact** — Customers affected, revenue at risk, SLA impact
- **Technical Impact** — Error logs and performance details
- **Code Fixes** — Suggested code changes with before/after diff
- **Configuration Fixes** — Suggested config changes
- **Remediation** — Step-by-step recovery instructions
- **Verification Steps** — How to confirm the fix worked
- **Preventive Actions** — Long-term improvements
- **Post-Incident Report** — Downloadable Markdown report

## Free Tier Constraints

| Resource                 | Free Tier Limit       | IncidentIQ Usage           |
| ------------------------ | --------------------- | -------------------------- |
| Vercel Functions         | 100 GB-hours / month  | ~1 MB per invocation       |
| Vercel Function Duration | 60s (Pro), 10s (Free) | Configured for 10s default |
| Vercel Bandwidth         | 100 GB / month        | Minimal (JSON API)         |
| OpenRouter               | Free tier available   | ~1–2 cents / analysis      |
| GitHub Actions           | 2,000 min / month     | ~2 min per CI run          |

> **Note:** The API function is configured with `maxDuration: 10` by default (matching Vercel's free tier). If you upgrade to Pro, you can increase this to 60s for more complex analyses.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

### Code Quality

All code must pass:

- `npm run check` — Format check + lint + typecheck
- Zero ESLint warnings (`--max-warnings=0`)
- TypeScript strict mode compliance

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

Built with ❤️ for the hackathon.# incidentiq
