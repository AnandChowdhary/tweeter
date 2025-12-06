#!/usr/bin/env node

import { run } from "@openai/agents";
import {
  currentNoteThreadGenerator,
  voiceGenerator,
} from "../functions/agents";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";

const noteContent = process.env.NOTE || "";

(async () => {
  if (!noteContent) {
    console.error("Please provide a note as an environment variable");
    process.exit(1);
  }

  console.log(
    "Processing note:",
    noteContent.substring(0, 100) + (noteContent.length > 100 ? "..." : "")
  );

  const notesPost = `Date: ${new Date().toISOString()}\n\n${noteContent}`;
  console.log("Generating thread for note");

  const initialResult = await run(currentNoteThreadGenerator, notesPost);
  if (!initialResult.finalOutput)
    throw new Error("No output from currentNoteThreadGenerator");
  console.log("Initial result", initialResult.finalOutput.length);

  const voiceResult = await run(
    voiceGenerator,
    `Please rewrite the following tweets based on the note.\n\n<note>\n${notesPost}\n</note>\n\n${initialResult.finalOutput}\n\nRespond only with <tweet>...</tweet> tags for the tweets in the thread. If this is a thread with multiple tweets, the first tweet should end two emoji, one relevant to the thread + 👇 so people can click to read the rest of the thread.`
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
