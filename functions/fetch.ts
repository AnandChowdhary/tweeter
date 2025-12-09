import Firecrawl from "@mendable/firecrawl-js";

const apiKey = process.env.FIRECRAWL_API_KEY;
if (!apiKey)
  throw new Error("FIRECRAWL_API_KEY environment variable is required");

export const firecrawl = new Firecrawl({ apiKey });

export async function fireCrawlFetch(url: string): Promise<string> {
  const doc = await firecrawl.scrapeUrl(url, { formats: ["markdown"] });
  if (!doc.success) throw new Error(doc.error);
  if (!doc.markdown) throw new Error("No markdown content returned");
  return doc.markdown;
}
