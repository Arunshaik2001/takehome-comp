# Takehome Comp

Independent reference for **India** tech compensation shared on LeetCode Discuss (`#compensation`), with **estimated net pay** after tax, PF, and related payroll deductions—not headline CTC alone.

**Not affiliated with LeetCode.** Estimates are illustrative only; not tax or legal advice.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Static dataset: `src/data/offers.json` (generated at build time)

## Commands

```bash
nvm use          # Node 20+ (see .nvmrc)
npm install
npm run data:build   # Refresh offers from public parsed JSONL (see Data pipeline)
npm run build        # data:build + production Next.js build
npm run dev
```

## Deploy

### GitHub Pages (live)

**https://takehomecomp.in/**

Pushes to `main` run [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml). On each run it:

1. **Syncs** new LeetCode `#compensation` posts via [leetcomp](https://github.com/Arunshaik2001/leetcode-compensation) (`leetcomp-sync`, LeetCode GraphQL + parsing)
2. **Builds** `offers.json` and the static site (`npm run build:pages`)
3. **Deploys** to GitHub Pages

The workflow also runs **daily at 06:00 IST** (`schedule.cron` in UTC). Manual run: **Actions → Deploy to GitHub Pages → Run workflow**.

### One-time: GitHub Actions secret (required for sync)

Add a repository secret on **takehome-comp** (and on **leetcode-compensation** if you use its backup sync workflow):

| Secret | Value |
|--------|--------|
| `GH_TOKEN` | Personal access token with **`repo`** scope (classic) or **Contents: Read and write** on `Arunshaik2001/leetcode-compensation` (fine-grained). Used to push synced JSONL to your fork and to call **GitHub Models** for parsing new posts. |

Without `GH_TOKEN`, the workflow still syncs in the runner and deploys fresh data for that run, but **cannot push** updates back to the fork (the next run starts from the last committed JSONL again).

Create the secret: **Settings → Secrets and variables → Actions → New repository secret**.

### Vercel (optional custom domain)

Import [github.com/Arunshaik2001/takehome-comp](https://github.com/Arunshaik2001/takehome-comp) in Vercel; build with `npm run build` (no `GITHUB_PAGES` env).

## Data pipeline

1. **Source posts** — LeetCode Discuss `#compensation` (fetched via GraphQL in [Arunshaik2001/leetcode-compensation](https://github.com/Arunshaik2001/leetcode-compensation), fork of the community leetcomp project).
2. **CI sync** — `leetcomp-sync` appends and LLM-parses new posts into `data/posts.jsonl` and `data/parsed_posts.jsonl`.
3. **`npm run data:build`** — Reads those JSONL files (local `LEETCOMP_DATA_DIR` in CI, or raw GitHub URLs locally), keeps the last 365 days, enriches breakups from post text, computes take-home, writes `src/data/offers.json`.

Optional env for local builds:

```bash
export LEETCOMP_DATA_REPO=Arunshaik2001/leetcode-compensation   # default
export LEETCOMP_DATA_DIR=/path/to/leetcode-compensation/data    # skip HTTP download
npm run data:build
```

4. **Attribution** — We link to original Discuss posts per row; respect LeetCode [Terms of Service](https://leetcode.com/terms/). The public site does not call LeetCode at runtime.

## Tax models (estimates only)

| Region | Model |
|--------|--------|
| India (INR) | New regime FY 2025–26 slabs, §87A rebate, ₹75k standard deduction, employee PF (12% on ₹15k wage ceiling), professional tax; joining bonus included in year-1 estimate when parsed |
| US (USD) | Retained in code for pipeline; UI focuses on India |

Verify all figures against your payslip and a qualified chartered accountant.

## Legal (summary)

- User-generated Discuss data may be wrong or outdated; we do not verify with employers.
- LeetCode is a trademark of its respective owner; company names are used descriptively.
- Full disclaimers appear in the site footer (`SiteFooter` component).

## Project name

Folder: **`takehome-comp`**
