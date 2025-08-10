#!/usr/bin/env node

import { run } from "@openai/agents";
import { readFileSync } from "fs";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { linkThreadGenerator, voiceGenerator } from "../functions/agents";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";

const link = process.argv[2];

(async () => {
  if (!link) {
    console.error("Please provide a link as an argument");
    process.exit(1);
  }

  let comment = "";
  try {
    comment = readFileSync("comment.txt", "utf8").trim();
  } catch (error) {
    console.warn("Could not read comment file:", error);
    comment = "";
  }

  console.log("Fetching content", link);
  const contentOriginal = await fetch(link).then((res) => res.text());

  let content = contentOriginal;
  try {
    content = NodeHtmlMarkdown.translate(contentOriginal);
  } catch (error) {
    console.warn("Could not convert content to markdown:", error);
  }
  console.log("Content", content.length);

  // Prepare the input for the link thread generator
  let input = `Link: ${link}\n\n${content}`;
  if (comment) {
    input = `Link: ${link}\n\n<original article content>${content}</original article content>\n\n---\n\nComment from user that you take into account when shaping your opinion and generating the thread: ${comment}`;
    console.log("Using comment:", comment);
  }

  const initialResult = await run(linkThreadGenerator, input);
  if (!initialResult.finalOutput)
    throw new Error("No output from blogThreadGenerator");
  console.log("Initial result", initialResult.finalOutput.length);

  const voiceResult = await run(
    voiceGenerator,
    `Please rewrite the following tweets based on the article\n\n${initialResult.finalOutput}\n\nRespond only with <tweet>...</tweet> tags for the tweets in the thread and don't include any links apart from the original article link or any emojis.\n\nFirst tweet: Keep it punchy and under 250 characters. Middle tweets: Use paragraph breaks for technical depth, there is no strict character limit anymore in Twitter, so you can go as long as you want; it's suggested to have 1-3 short paragraphs in each tweet and break them thematically. Final tweet: Wrap with genuine questions (if any, optional, no more than 3, but usually you don't need questions unless you have something specific to add to the conversation) but always have a thoughtful conclusion.`
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
})();
