import { run } from "@openai/agents";
import { XMLParser } from "fast-xml-parser";
import { NodeHtmlMarkdown } from "node-html-markdown";
import {
  generateAiNewsIdeas,
  generateTechnicalTweetScore,
  newsThreadGenerator,
  threadToTweetGenerator,
  voiceGenerator,
} from "../functions/agents";
import {
  parseTweetsFromContent,
  parseTweetsFromContentAsArray,
} from "../functions/response-parsers";
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

  if (
    latestItem.title.trim().toLowerCase().includes("not much happened today")
  ) {
    console.log("Skipping 'not much happened today' item");
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
  const ideas = await generateAiNewsIdeas(content);
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

    const { technicalScore } = await generateTechnicalTweetScore(
      voiceResult.finalOutput
    );

    if (technicalScore >= 8) {
      const voiceResult2 = await run(
        voiceGenerator,
        `I wrote this technical thread to post on Twitter. The idea is to do thought leadership on Twitter like Naval Ravikant or Paul Graham and sometimes randomly post a life lesson, learning, or a powerful quote that is original to me as a short tweet with no other context. So I wrote this piece about the latest AI news. But I think it's too long and too technical. I actually want to write it for technical founders, not researchers, so it should be more approachable. Please rewrite this as a single <tweet>...</tweet> tag with a single tweet. It should be a short tweet in sentence case with 1-2 sentences with the core idea of the thread.\n\nHere are the previous tweets for inspiration:\n - De‑risk before you leap. Side projects plus a stable salary buy the resource founders need most: mental space. If you raise, raise enough to pay yourself a baseline. You'll make better calls when rent isn't in the prompt.\n - Hire fewer, higher‑leverage builders. Four "cheap" devs rarely equal one elite engineer. As AI handles the average work, the premium is judgment, communication, and taste. A tiny team of killers + agents beats a platoon of passengers.\n - AI UX isn't a chat box. The lazy way to "add AI" is a text field, but the best way is invisible: models doing the work under the hood so users don't have to.\n\nPlease generate the single tweet from this thread:\n\n${voiceResult.finalOutput}`
      );

      if (!voiceResult2.finalOutput) {
        console.error(
          `No output from voiceGenerator for ${voiceResult.finalOutput.length}`
        );
        return;
      }

      console.log("Voice result length:", voiceResult2.finalOutput.length);

      const tweets = parseTweetsFromContentAsArray(voiceResult2.finalOutput);
      console.log("Tweets", tweets);

      let start = new Date();
      for (const tweet of tweets) {
        start.setDate(start.getDate() + 1);
        start.setHours(
          1,
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60),
          0
        );
        const scheduleDate = start.toISOString();

        const draft = await createDraft({
          content: tweet,
          options: { scheduleDate },
        });
        console.log("Scheduled tweet", draft.id);
      }
    } else if (Math.random() > 0.5) {
      const voiceResult2 = await run(
        threadToTweetGenerator,
        voiceResult.finalOutput
      );
      if (!voiceResult2.finalOutput)
        throw new Error("No output from threadToTweetGenerator");
      console.log("Voice result length:", voiceResult2.finalOutput.length);

      const tweets = parseTweetsFromContent(voiceResult2.finalOutput);
      console.log("Tweets", tweets);

      const draft = await createDraft({
        content: tweets,
        options: { scheduleDate: "next-free-slot" },
      });
      console.log("Scheduled tweet", draft.id);
    } else {
      const tweets = parseTweetsFromContent(voiceResult.finalOutput);
      console.log("Tweets", tweets);

      const draft = await createDraft({
        content: tweets,
        options: { scheduleDate: "next-free-slot" },
      });
      console.log("Scheduled tweet", draft.id);
    }
  }

  saveState({
    previousSmolAiNewsThread: latestItem.guid["#text"],
    lastDailyRunAt: new Date().toISOString(),
  });
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
