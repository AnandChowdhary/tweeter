#!/usr/bin/env node

import { run } from "@openai/agents";

import { NodeHtmlMarkdown } from "node-html-markdown";
import { linkThreadGenerator, voiceGenerator } from "../functions/agents";
import { fireCrawlFetch } from "../functions/fetch";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";

const link = process.argv[2];
const comment = process.env.COMMENT || "";

(async () => {
  if (!link) {
    console.error("Please provide a link as an argument");
    process.exit(1);
  }

  console.log("Fetching content", link);
  const contentOriginal = await fireCrawlFetch(link);

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
    `Please rewrite the following based on the article in 100-200 words.\n\n${initialResult.finalOutput}\n\nThe first paragraph should end with two emoji, one relevant to the thread + 👇 so people can click to read the rest of the thread. Include the link to the article at the end.`
  );

  if (!voiceResult.finalOutput)
    throw new Error("No output from voiceGenerator");
  console.log("Voice result", voiceResult.finalOutput.length);

  const tweets = parseTweetsFromContent(voiceResult.finalOutput);
  console.log("Tweets", tweets);

  const draft = await createDraft({
    content: tweets,
  });
  console.log("Scheduled tweet", draft.id);
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
