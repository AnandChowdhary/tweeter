import { run } from "@openai/agents";
import { XMLParser } from "fast-xml-parser";
import { NodeHtmlMarkdown } from "node-html-markdown";
import {
  generateAiNewsIdeas,
  newsThreadGenerator,
  voiceGenerator,
} from "../functions/agents";
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
  if (
    !channel.item ||
    !Array.isArray(channel.item) ||
    channel.item.length === 0
  ) {
    console.log("No items found or items not in expected format");
    if (channel.item) {
      console.log("Channel structure:", JSON.stringify(channel, null, 2));
    }
    return;
  }

  // Find the first suitable item (not already tweeted, not "not much happened today")
  let selectedItem: RSSItem | null = null;
  for (const item of channel.item) {
    const isAlreadyTweeted =
      state.previousSmolAiNewsThread === item.guid["#text"];
    if (isAlreadyTweeted) {
      console.log(
        `Item "${item.title}" already tweeted (GUID: ${item.guid["#text"]}), checking next...`
      );
      continue;
    }

    if (item.title.trim().toLowerCase().includes("not much happened today")) {
      console.log(
        `Skipping "not much happened today" item: "${item.title}", checking next...`
      );
      continue;
    }

    // Found a suitable item
    selectedItem = item;
    console.log(`Selected item: "${item.title}"`);
    break;
  }

  if (!selectedItem) {
    console.log(
      "No suitable news item found (all already tweeted or 'not much happened today'), skipping"
    );
    return;
  }

  let content = selectedItem["content:encoded"].split("AI Reddit Recap")[0];
  try {
    content = NodeHtmlMarkdown.translate(content);
  } catch (error) {
    console.warn("Could not convert content to markdown:", error);
  }
  console.log("Content", content.length);
  
  // Get recent tweets from state to avoid repetition
  const recentTweets = state.recentTweets || [];
  console.log(`Using ${recentTweets.length} recent tweets as context`);
  
  const ideas = await generateAiNewsIdeas(content, recentTweets);
  console.log("Ideas", ideas.tweet_topics.map((t) => t.title).join(", "));

  // Collect new tweet topics to save
  const newTweetTopics: string[] = [];

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
      `Please rewrite the following based on the news for an audience of technical founders with a bit of humor if needed in around 150-250 words\n\n${initialResult.finalOutput}.`
    );

    if (!voiceResult.finalOutput)
      throw new Error("No output from voiceGenerator");
    console.log("Voice result", voiceResult.finalOutput.length);

    const draft = await createDraft({
      content: voiceResult.finalOutput,
    });
    console.log("Scheduled tweet", draft.id);
    
    // Save the idea title to track what we've covered
    newTweetTopics.push(idea.title);
  }

  // Update state with new topics, keeping most recent 50
  const updatedRecentTweets = [...newTweetTopics, ...recentTweets].slice(0, 50);
  
  saveState({
    previousSmolAiNewsThread: selectedItem.guid["#text"],
    lastDailyRunAt: new Date().toISOString(),
    recentTweets: updatedRecentTweets,
  });
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
