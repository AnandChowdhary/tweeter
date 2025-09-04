#!/usr/bin/env node

import { run } from "@openai/agents";
import { browserTopIdeasGenerator, voiceGenerator } from "../functions/agents";
import { parseTweetsFromContentAsArray } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";
import { saveState } from "../functions/state";

const comment = process.env.COMMENT || "";

(async () => {
  if (!comment) {
    console.error("Please provide a comment as an argument");
    process.exit(1);
  }

  const initialResult = await run(browserTopIdeasGenerator, comment);
  if (!initialResult.finalOutput)
    throw new Error("No output from blogThreadGenerator");
  console.log("Initial result", initialResult.finalOutput.length);

  const voiceResult = await run(
    voiceGenerator,
    `These are some ideas for quotes to post on Twitter. The idea is to do thought leadership on Twitter like Naval Ravikant or Paul Graham and sometimes randomly post a life lesson, learning, or a powerful quote that is original to me as a short tweet with no other context. Please respond with <tweet>...</tweet> tags for the tweets, one for each tweet. It should be a few sentences.\n\nHere are the previous tweets for inspiration:\n - De‑risk before you leap. Side projects plus a stable salary buy the resource founders need most: mental space. If you raise, raise enough to pay yourself a baseline. You'll make better calls when rent isn't in the prompt.\n - Hire fewer, higher‑leverage builders. Four "cheap" devs rarely equal one elite engineer. As AI handles the average work, the premium is judgment, communication, and taste. A tiny team of killers + agents beats a platoon of passengers.\n - AI UX isn't a chat box. The lazy way to "add AI" is a text field, but the best way is invisible: models doing the work under the hood so users don't have to.\n\nPlease generate tweets from these new ideas:\n\n${initialResult.finalOutput}`
  );

  if (!voiceResult.finalOutput) {
    console.error(
      `No output from voiceGenerator for ${initialResult.finalOutput.length}`
    );
    return;
  }

  console.log("Voice result length:", voiceResult.finalOutput.length);

  const tweets = parseTweetsFromContentAsArray(voiceResult.finalOutput);
  console.log("Tweets", tweets);

  let start = new Date();
  for (const tweet of tweets) {
    start.setDate(start.getDate() + 1);
    start.setHours(
      6,
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

  saveState({ lastHistoryThreadRunAt: new Date().toISOString() });
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
