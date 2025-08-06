import { run } from "@openai/agents";
import { XMLParser } from "fast-xml-parser";
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
    state.previousSmolAiNewsThread === latestItem.guid["#text"];
  if (isLatestAlreadyTweeted) {
    console.log("Latest news already tweeted, skipping");
    return;
  }

  const content = latestItem["content:encoded"].split("AI Reddit Recap")[0];
  const ideas = await generateIdeas(content);

  for (const idea of ideas.tweet_topics) {
    const initialResult = await run(
      newsThreadGenerator,
      [idea.title, idea.excerpt].join("\n")
    );
    if (!initialResult.finalOutput)
      throw new Error("No output from blogThreadGenerator");

    const voiceResult = await run(
      voiceGenerator,
      `Please rewrite the following tweets based on the news\n\n${initialResult.finalOutput}\n\nRespond only with <tweet>...</tweet> tags for the tweets in the thread and don't include any links or emojis. Add a thoughtful and nuanced opinion about the topic (introduce it in the first tweet and detail it in the last tweet). Don't include any question at the end. It's for a technical audience.`
    );

    if (!voiceResult.finalOutput)
      throw new Error("No output from voiceGenerator");

    const tweets = parseTweetsFromContent(voiceResult.finalOutput);

    const draft = await createDraft({
      content: tweets,
      options: { scheduleDate: "next-free-slot", threadify: true },
    });
    console.log("Scheduled tweet", draft.id);
  }

  saveState({
    previousSmolAiNewsThread: latestItem.guid["#text"],
    lastDailyRunAt: new Date().toISOString(),
  });
})();
