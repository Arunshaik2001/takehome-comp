#!/usr/bin/env node
/**
 * Builds offers.json from LeetCode compensation posts (last 365 days).
 * Primary path: community-parsed JSONL (leetcomp pipeline output, sourced from LeetCode GraphQL).
 * Optional: --refresh-metadata hits LeetCode GraphQL for latest post count.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractCompComponents,
} from "./extract-comp-components.mjs";
import { takeHomeIndia } from "./india-takehome.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "src/data/offers.json");
const WINDOW_DAYS = 365;
const PARSED_URL =
  "https://raw.githubusercontent.com/0xku/leetcode-compensation/master/data/parsed_posts.jsonl";
const POSTS_URL =
  "https://raw.githubusercontent.com/0xku/leetcode-compensation/master/data/posts.jsonl";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql/";
const LIST_QUERY = {
  query: `query discussPostItems($orderBy: ArticleOrderByEnum, $keywords: [String]!, $tagSlugs: [String!], $skip: Int, $first: Int) {
    ugcArticleDiscussionArticles(orderBy: $orderBy keywords: $keywords tagSlugs: $tagSlugs skip: $skip first: $first) {
      totalNum
    }
  }`,
  variables: {
    orderBy: "MOST_RECENT",
    keywords: [""],
    tagSlugs: ["compensation"],
    skip: 0,
    first: 1,
  },
  operationName: "discussPostItems",
};

function regionForCurrency(currency) {
  if (currency === "INR") return "IN";
  if (currency === "USD") return "US";
  return "OTHER";
}

function takeHomeUs(totalUsd) {
  const gross = totalUsd;
  const ss = Math.min(gross, 168_600) * 0.062;
  const medicare = gross * 0.0145;
  const taxable = Math.max(0, gross - 14_600 - ss - medicare);
  const fed = federalUs(taxable);
  const state = Math.round(taxable * 0.05);
  const ded = Math.round(ss) + Math.round(medicare) + fed + state;
  const net = Math.max(0, gross - ded);
  return {
    region: "US",
    currency: "USD",
    grossAnnual: gross,
    grossMonthly: Math.round(gross / 12),
    netAnnual: net,
    netMonthly: Math.round(net / 12),
    totalDeductionsAnnual: ded,
    effectiveRate: gross > 0 ? ded / gross : 0,
    lines: [
      { id: "ss", label: "Social Security", amountAnnual: Math.round(ss) },
      { id: "medicare", label: "Medicare", amountAnnual: Math.round(medicare) },
      { id: "fed", label: "Federal tax (est.)", amountAnnual: fed },
      { id: "state", label: "State tax (est. 5%)", amountAnnual: state },
    ],
    disclaimer: "Rough US single-filer estimate.",
  };
}

function federalUs(taxable) {
  const brackets = [
    [11_600, 0.1],
    [47_150, 0.12],
    [100_525, 0.22],
    [191_950, 0.24],
    [243_725, 0.32],
    [609_350, 0.35],
    [Infinity, 0.37],
  ];
  let tax = 0;
  let prev = 0;
  for (const [upTo, rate] of brackets) {
    const band = Math.min(taxable, upTo) - prev;
    if (band > 0) tax += band * rate;
    prev = upTo;
    if (taxable <= upTo) break;
  }
  return Math.round(tax);
}

function capitalize(s) {
  if (!s) return "N/A";
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function transformRecord(rec, postTextById) {
  const currency = rec.currency || "INR";
  const base = rec.base ?? null;
  const total = rec.total ?? rec["total-calculated"] ?? null;

  let baseLpa = null;
  let totalLpa = null;
  let baseUsd = null;
  let totalUsd = null;

  if (currency === "INR") {
    baseLpa = base;
    totalLpa = total;
  } else if (currency === "USD") {
    baseUsd = base != null ? base * 1000 : null;
    totalUsd = total != null ? total * 1000 : null;
    if (baseUsd == null && base != null && base > 500) baseUsd = base;
    if (totalUsd == null && total != null && total > 500) totalUsd = total;
  }

  const postText = postTextById?.get(rec.id) ?? "";
  const offerContext = {
    company: rec["company-normalized"] || rec.company || "",
    role: rec["role-normalized"] || rec.role || "",
  };
  const compComponents =
    currency === "INR"
      ? extractCompComponents(postText, baseLpa, totalLpa, offerContext)
      : { variableLpa: null, joiningBonusLpa: null, stocksLpa: null };

  let takeHome = null;
  if (currency === "INR") takeHome = takeHomeIndia(baseLpa, totalLpa, compComponents);
  else if (currency === "USD") {
    const t = totalUsd ?? baseUsd;
    if (t) takeHome = takeHomeUs(t);
  }

  if (!takeHome) return null;

  const company = capitalize(rec["company-normalized"] || rec.company || "Unknown");
  const role = capitalize(rec["role-normalized"] || rec.role || "N/A");
  const row = {
    id: rec.id,
    postedAt: rec.created_at,
    company,
    role,
    location: capitalize(rec.location || ""),
    currency,
    region: regionForCurrency(currency),
    yoe: typeof rec.yoe === "number" ? Math.round(rec.yoe * 10) / 10 : null,
    baseLpa,
    totalLpa,
    compComponents,
    baseUsd,
    totalUsd,
    leetcodeTopicId: rec.id,
    takeHome,
  };

  const slug = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const offerKey = [
    row.id,
    slug(row.company),
    slug(row.role),
    baseLpa ?? "b",
    totalLpa ?? "t",
    baseUsd ?? "",
    totalUsd ?? "",
  ].join(":");

  return { offerKey, ...row };
}

async function fetchLeetcodeTotal() {
  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(LIST_QUERY),
  });
  const json = await res.json();
  return json?.data?.ugcArticleDiscussionArticles?.totalNum ?? null;
}

async function loadPostTextById() {
  console.log("Fetching raw post text for comp breakdown...");
  const res = await fetch(POSTS_URL);
  if (!res.ok) throw new Error(`Failed to download posts: ${res.status}`);
  const text = await res.text();
  const map = new Map();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const post = JSON.parse(line);
      if (post?.id != null) {
        map.set(
          post.id,
          `${post.title ?? ""}\n---\n${post.content ?? ""}`,
        );
      }
    } catch {
      /* skip */
    }
  }
  return map;
}

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);

  const postTextById = await loadPostTextById();

  console.log(`Fetching parsed LeetCode comp posts (${WINDOW_DAYS}d window)...`);
  const res = await fetch(PARSED_URL);
  if (!res.ok) throw new Error(`Failed to download parsed posts: ${res.status}`);
  const text = await res.text();

  const offers = [];
  let scanned = 0;
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    scanned++;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    if (rec["compensation-post"] !== true || rec.skip) continue;
    if (!rec.created_at || new Date(rec.created_at) < cutoff) continue;
    const offer = transformRecord(rec, postTextById);
    if (offer) offers.push(offer);
  }

  offers.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

  let leetcodeTotal = null;
  try {
    leetcodeTotal = await fetchLeetcodeTotal();
  } catch (e) {
    console.warn("LeetCode metadata fetch skipped:", e.message);
  }

  const dataset = {
    generatedAt: new Date().toISOString(),
    windowDays: WINDOW_DAYS,
    source:
      "LeetCode Discuss #compensation (parsed); synced via open leetcomp pipeline JSONL",
    leetcodeCompPostsTotal: leetcodeTotal,
    parsedRecordsScanned: scanned,
    offerCount: offers.length,
    offers,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(dataset, null, 2));
  console.log(`Wrote ${offers.length} offers → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
