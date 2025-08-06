/**
 * Parses tweet content from XML-like tags and returns them as a string array
 * @param content - The raw content containing tweet tags
 * @returns Array of tweet strings
 */
export function parseTweetsFromContent(content: string): string {
  const tweetRegex = /<tweet>\s*([\s\S]*?)\s*<\/tweet>/g;
  const tweets: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tweetRegex.exec(content)) !== null) {
    const tweetContent = match[1].trim();
    if (tweetContent) tweets.push(cleanContent(tweetContent));
  }
  return tweets.join("\n\n\n\n");
}

/**
 * Converts an array of tweets to lowercase
 * @param tweets - Array of tweet strings
 * @returns Array of lowercase tweet strings
 */
export function cleanContent(content: string): string {
  return content
    .replace(/“/g, '"') // Replace smart quotes with regular quotes
    .replace(/”/g, '"') // Replace smart quotes with regular quotes
    .replace(/‘/g, "'") // Replace smart apostrophes with regular apostrophes
    .replace(/’/g, "'") // Replace smart apostrophes with regular apostrophes
    .replace(/—/g, " - ") // Remove em-dashes
    .replace(/–/g, "-") // Remove en-dashes
    .replace(/…/g, "...") // Replace ellipsis with three dots
    .replace(/[\u201C\u201D]/g, '"') // Replace any remaining smart quotes
    .replace(/[\u2018\u2019]/g, "'") // Replace any remaining smart apostrophes
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " "); // Convert all types of spaces to normal space
}
