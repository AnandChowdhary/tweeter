/**
 * ScrapingBee fetch function that uses ScrapingBee API to scrape web pages
 * @param url - The URL to scrape
 * @param options - Optional fetch options (currently only supports headers)
 * @returns A fetch Response object with .text() and .json() methods
 *
 * @example
 * // Basic usage - drop-in replacement for native fetch
 * const response = await scrapingBeeFetch("https://example.com");
 * const html = await response.text();
 *
 * // For JSON responses
 * const response = await scrapingBeeFetch("https://api.example.com/data");
 * const data = await response.json();
 *
 * // With custom headers
 * const response = await scrapingBeeFetch("https://example.com", {
 *   headers: { "Custom-Header": "value" }
 * });
 */
export async function scrapingBeeFetch(
  url: string,
  options: { headers?: Record<string, string> } = {}
) {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;

  if (!apiKey) {
    throw new Error("SCRAPINGBEE_API_KEY environment variable is required");
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
