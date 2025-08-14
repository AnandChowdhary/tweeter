#!/usr/bin/env node

import { run } from "@openai/agents";
import { readFileSync } from "fs";
import {
  currentNoteThreadGenerator,
  voiceGenerator,
} from "../functions/agents";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";

const noteArgument = process.argv[2];

(async () => {
  let noteContent = "";

  if (noteArgument) {
    noteContent = noteArgument;
  } else {
    try {
      noteContent = readFileSync("note.txt", "utf8").trim();
    } catch (error) {
      console.error(
        "Please provide a note as an argument or create a note.txt file"
      );
      console.error('Usage: ./tasks/note.ts "Your note content here"');
      console.error(
        'Or: echo "Your note content" > note.txt && ./tasks/note.ts'
      );
      process.exit(1);
    }
  }

  if (!noteContent) {
    console.error("Note content cannot be empty");
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
    options: { scheduleDate: "next-free-slot" },
  });
  console.log("Scheduled tweet", draft.id);
})();
