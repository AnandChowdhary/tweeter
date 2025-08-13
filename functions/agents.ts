import { Agent, webSearchTool } from "@openai/agents";
import { readFileSync } from "node:fs";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prompts = {
  personalBlogTweetGenerator: readFileSync(
    "./prompts/personal-blog-tweet-generator.md",
    "utf-8"
  ),
  companyChangelogTweetGenerator: readFileSync(
    "./prompts/company-changelog-tweet-generator.md",
    "utf-8"
  ),
  newsTweetGenerator: readFileSync(
    "./prompts/news-tweet-generator.md",
    "utf-8"
  ),
  linkTweetGenerator: readFileSync(
    "./prompts/link-tweet-generator.md",
    "utf-8"
  ),
  notesTweetGenerator: readFileSync(
    "./prompts/notes-tweet-generator.md",
    "utf-8"
  ),
  openSourceProjectTweetGenerator: readFileSync(
    "./prompts/open-source-project-tweet-generator.md",
    "utf-8"
  ),
  starredRepoTweetGenerator: readFileSync(
    "./prompts/starred-repo-tweet-generator.md",
    "utf-8"
  ),
  ideasGenerator: readFileSync("./prompts/ideas-generator.md", "utf-8"),
  voice: readFileSync("./prompts/voice.md", "utf-8"),
};

export const blogThreadGenerator = new Agent({
  name: "Blog Post to Twitter Thread Generator",
  instructions: prompts.personalBlogTweetGenerator,
  tools: [webSearchTool()],
  model: "gpt-5",
});

export const companyChangelogThreadGenerator = new Agent({
  name: "Company Changelog to Twitter Thread Generator",
  instructions: prompts.companyChangelogTweetGenerator,
  tools: [webSearchTool()],
  model: "gpt-5",
});

export const newsThreadGenerator = new Agent({
  name: "News to Twitter Thread Generator",
  instructions: prompts.newsTweetGenerator,
  tools: [webSearchTool()],
  model: "gpt-5",
});

export const linkThreadGenerator = new Agent({
  name: "Link to Twitter Thread Generator",
  instructions: prompts.linkTweetGenerator,
  tools: [webSearchTool()],
  model: "gpt-5",
});

export const notesThreadGenerator = new Agent({
  name: "Notes to Twitter Thread Generator",
  instructions: prompts.notesTweetGenerator,
  tools: [webSearchTool()],
  model: "gpt-5",
});

export const openSourceProjectTweetGenerator = new Agent({
  name: "Open Source Project to Twitter Thread Generator",
  instructions: prompts.openSourceProjectTweetGenerator,
  tools: [webSearchTool()],
  model: "gpt-5",
});

export const starredRepoTweetGenerator = new Agent({
  name: "Starred Repository to Twitter Thread Generator",
  instructions: prompts.starredRepoTweetGenerator,
  tools: [webSearchTool()],
  model: "gpt-5",
});

export const voiceGenerator = new Agent({
  name: "Rewrite in voice",
  instructions: prompts.voice,
  model: "gpt-5",
});

const TweetTopicSchema = z.object({ title: z.string(), excerpt: z.string() });

const IdeasResponseSchema = z.object({
  tweet_topics: z.array(TweetTopicSchema),
});

export const generateIdeas = async (
  content: string
): Promise<z.infer<typeof IdeasResponseSchema>> => {
  const response = await openai.responses.parse({
    model: "gpt-5",
    input: [
      { role: "system", content: prompts.ideasGenerator },
      { role: "user", content: content },
    ],
    text: { format: zodTextFormat(IdeasResponseSchema, "ideas") },
  });
  if (!response.output_parsed) throw new Error("No response parsed");
  return response.output_parsed;
};
