#!/usr/bin/env node
/**
 * Append rule-based parsed rows for posts present in posts.jsonl but missing
 * from parsed_posts.jsonl (e.g. when leetcomp LLM parsing fails in CI).
 */

import fs from "node:fs";
import path from "node:path";
import {
  detectOfferBlocks,
  extractBaseTotalFromSection,
  parseCompanyFromHeader,
} from "./extract-comp-components.mjs";

const dataDir = path.resolve(
  process.argv[2] || process.env.LEETCOMP_DATA_DIR || "",
);
if (!dataDir || !fs.existsSync(dataDir)) {
  console.error("Usage: node supplement-parsed-posts.mjs <leetcomp/data/dir>");
  process.exit(1);
}

const postsFile = path.join(dataDir, "posts.jsonl");
const parsedFile = path.join(dataDir, "parsed_posts.jsonl");

function capitalize(s) {
  if (!s) return "N/A";
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeKey(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function looksLikeIndiaComp(text) {
  if (/₹|rs\.?\s*\d|inr\b|\blpa\b|lakh|lac\b|crore|\bcr\b/i.test(text)) {
    return true;
  }
  if (
    /\b(bengaluru|bangalore|gurugram|gurgaon|hyderabad|mumbai|chennai|noida|pune|india)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  return !/\$\s*\d|usd\b|\bbay area\b|\bseattle\b|\bnew york\b/i.test(text);
}

function companyFromTitle(title) {
  if (!title) return null;
  const parts = title.split("|").map((p) => p.trim());
  if (parts[0]) {
    const c = parseCompanyFromHeader(parts[0]) || parts[0];
    if (c && c.length > 1) return c;
  }
  return parseCompanyFromHeader(title);
}

function roleFromTitle(title) {
  if (!title?.includes("|")) return "N/A";
  const parts = title.split("|").map((p) => p.trim());
  return parts[1] || "N/A";
}

function locationFromTitle(title) {
  if (!title?.includes("|")) return "";
  const parts = title.split("|").map((p) => p.trim());
  return parts[2] || parts[parts.length - 1] || "";
}

function loadParsedPostIds() {
  const ids = new Set();
  if (!fs.existsSync(parsedFile)) return ids;
  for (const line of fs.readFileSync(parsedFile, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line);
      if (rec.id != null && rec["compensation-post"] === true && !rec.skip) {
        ids.add(rec.id);
      }
    } catch {
      /* skip */
    }
  }
  return ids;
}

function main() {
  const parsedIds = loadParsedPostIds();
  if (!fs.existsSync(postsFile)) {
    console.warn("No posts.jsonl — nothing to supplement.");
    return;
  }

  const newLines = [];
  let postsTouched = 0;

  for (const line of fs.readFileSync(postsFile, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let post;
    try {
      post = JSON.parse(line);
    } catch {
      continue;
    }
    if (post.id == null || parsedIds.has(post.id)) continue;

    const fullText = `${post.title ?? ""}\n---\n${post.content ?? ""}`;
    if (!looksLikeIndiaComp(fullText)) continue;

    const blocks = detectOfferBlocks(fullText);
    let addedForPost = 0;

    for (const block of blocks) {
      const { baseLpa, totalLpa } = extractBaseTotalFromSection(
        block.sectionText,
      );
      let base = baseLpa;
      let total = totalLpa;
      if (base == null && total != null) {
        base = Math.round(total * 0.72 * 100) / 100;
      }
      if (total == null && base != null) {
        total = base;
      }
      if (base == null && total == null) continue;

      const companyRaw =
        block.company ||
        companyFromTitle(post.title) ||
        parseCompanyFromHeader(block.header) ||
        "Unknown";
      const company = capitalize(companyRaw);
      const role = capitalize(roleFromTitle(post.title));
      const location = capitalize(
        locationFromTitle(post.title) || block.header || "",
      );

      const rec = {
        id: post.id,
        created_at: post.created_at,
        skip: false,
        "compensation-post": true,
        "offer-type": "full-time",
        company,
        "company-normalized": normalizeKey(companyRaw),
        role,
        "role-normalized": normalizeKey(role),
        yoe: null,
        base,
        total,
        location,
        currency: "INR",
        "parse-source": "takehome-supplement",
      };
      newLines.push(JSON.stringify(rec));
      addedForPost++;
    }

    if (addedForPost > 0) {
      postsTouched++;
      parsedIds.add(post.id);
    }
  }

  if (newLines.length === 0) {
    console.log("Supplement: no new parsed rows to append.");
    return;
  }

  fs.appendFileSync(parsedFile, `${newLines.join("\n")}\n`);
  console.log(
    `Supplement: appended ${newLines.length} parsed row(s) for ${postsTouched} post(s).`,
  );
}

main();
