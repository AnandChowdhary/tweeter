import { Agent, webSearchTool } from "@openai/agents";
import { readFileSync } from "node:fs";

const prompts = {
  tweetGenerator: readFileSync("./prompts/tweet-generator.md", "utf-8"),
  voice: readFileSync("./prompts/voice.md", "utf-8"),
};

export const threadGenerator = new Agent({
  name: "Blog Post to Twitter Thread Generator",
  instructions: prompts.tweetGenerator,
  tools: [webSearchTool()],
});

export const voiceGenerator = new Agent({
  name: "Rewrite in voice",
  instructions: prompts.voice,
  model: "gpt-4o",
});
