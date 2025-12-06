export async function fireCrawlFetch(
  url: string,
  options: { headers?: Record<string, string> } = {}
) {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is required");
  }

  // Encode the URL for ScrapingBee
  const encodedUrl = encodeURIComponent(url);
  const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1?api_key=${apiKey}&url=${encodedUrl}`;

  return fetch(scrapingBeeUrl, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ScrapingBee/1.0)",
      ...options.headers,
    },
  });
}
