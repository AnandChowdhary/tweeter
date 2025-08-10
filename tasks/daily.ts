import { run } from "@openai/agents";
import { XMLParser } from "fast-xml-parser";
import { NodeHtmlMarkdown } from "node-html-markdown";
import {
  generateIdeas,
  newsThreadGenerator,
  voiceGenerator,
} from "../functions/agents";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";
import { saveState, state } from "../functions/state";

interface RSSItem {
  title: string;
  link: string;
  guid: {
    "#text": string;
    "@_isPermaLink": string;
  };
  description: string;
  pubDate: string;
  category: string[];
  "content:encoded": string;
}

interface RSSChannel {
  title: string;
  description: string;
  link: string;
  language: string;
  item: RSSItem[];
}

interface RSSFeed {
  rss: { channel: RSSChannel };
}

(async () => {
  const rss = await fetch("https://news.smol.ai/rss.xml").then((res) =>
    res.text()
  );

  // Use fast-xml-parser instead of DOMParser
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
  });

  const parsedRSS = parser.parse(rss) as RSSFeed;

  const channel = parsedRSS.rss.channel;

  // Check if items exist and handle the case where they might be in a different format
  if (!channel.item || !Array.isArray(channel.item)) {
    console.log("No items found or items not in expected format");
    console.log("Channel structure:", JSON.stringify(channel, null, 2));
    return;
  }

  const latestItem = channel.item[0];
  if (!latestItem) {
    console.log("No news found, skipping");
    return;
  }

  const isLatestAlreadyTweeted =
    state.previousSmolAiNewsThread === latestItem.guid["#text"] + "test";
  if (isLatestAlreadyTweeted) {
    console.log("Latest news already tweeted, skipping");
    return;
  }

  let content = latestItem["content:encoded"].split("AI Reddit Recap")[0];
  try {
    content = NodeHtmlMarkdown.translate(content);
  } catch (error) {
    console.warn("Could not convert content to markdown:", error);
  }
  console.log("Content", content.length);
  const ideas = await generateIdeas(content);
  console.log("Ideas", ideas.tweet_topics.map((t) => t.title).join(", "));

  for (const idea of ideas.tweet_topics) {
    const initialResult = await run(
      newsThreadGenerator,
      [idea.title, idea.excerpt].join("\n")
    );
    if (!initialResult.finalOutput)
      throw new Error("No output from blogThreadGenerator");
    console.log("Initial result", initialResult.finalOutput.length);

    const voiceResult = await run(
      voiceGenerator,
      `Please rewrite the following tweets based on the news for an audience of technical founders with a bit of humor if needed\n\n${initialResult.finalOutput}\n\nRespond only with <tweet>...</tweet> tags for the tweets in the thread and don't include any links or emojis.\n\nFirst tweet: Keep it punchy and under 250 characters. Middle tweets: Use paragraph breaks for technical depth, there is no strict character limit anymore in Twitter, so you can go as long as you want; it's suggested to have 1-3 short paragraphs in each tweet and break them thematically. Final tweet: Wrap with genuine questions (if any, optional, no more than 3) and a thoughtful conclusion.`
    );

    if (!voiceResult.finalOutput)
      throw new Error("No output from voiceGenerator");
    console.log("Voice result", voiceResult.finalOutput.length);

    const tweets = parseTweetsFromContent(voiceResult.finalOutput);
    console.log("Tweets", tweets);

    const draft = await createDraft({
      content: tweets,
      options: { scheduleDate: "next-free-slot" },
    });
    console.log("Scheduled tweet", draft.id);
  }

  saveState({
    previousSmolAiNewsThread: latestItem.guid["#text"],
    lastDailyRunAt: new Date().toISOString(),
  });
})();
