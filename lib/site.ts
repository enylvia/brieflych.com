export const SITE_NAME = "BrieflyCH";
export const SITE_DESCRIPTION =
  "BrieflyCH helps candidates discover curated, high-signal job opportunities from trusted hiring sources.";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://brieflych.com").replace(/\/$/, "");
}
