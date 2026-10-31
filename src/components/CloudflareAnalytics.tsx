import Script from "next/script";

const CF_BEACON = JSON.stringify({
  token: "af2935a28e8e4b66a4df2a61a965cf04",
});

export function CloudflareAnalytics() {
  if (process.env.GITHUB_PAGES !== "true") {
    return null;
  }

  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="lazyOnload"
      type="module"
      data-cf-beacon={CF_BEACON}
    />
  );
}
