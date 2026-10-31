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

**https://arunshaik2001.github.io/takehome-comp/**

Pushes to `main` run [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) (`npm run build:pages`). The same workflow also runs **once per day** (06:00 IST) to re-download parsed comp data and redeploy.

To change the schedule, edit the `schedule.cron` line in that workflow ([cron syntax](https://docs.github.com/en/actions/writing-workflows/scheduled-triggers), UTC). You can run it anytime from **Actions → Deploy to GitHub Pages → Run workflow**.

### Vercel (optional custom domain)

Import [github.com/Arunshaik2001/takehome-comp](https://github.com/Arunshaik2001/takehome-comp) in Vercel; build with `npm run build` (no `GITHUB_PAGES` env).

## Data pipeline

1. **Source posts** — Public LeetCode Discuss threads tagged compensation (user-generated content).
2. **`npm run data:build`** — Downloads community-parsed JSONL ([leetcomp](https://github.com/0xku/leetcode-compensation)), keeps the last 365 days, parses compensation components from post text where possible, computes take-home estimates, writes `src/data/offers.json`.
3. **Attribution** — We link to original Discuss posts per row; respect LeetCode [Terms of Service](https://leetcode.com/terms/) and do not scrape logged-in APIs at runtime in the public app.

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
