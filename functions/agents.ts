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
  newsThreadGenerator: readFileSync(
    "./prompts/news-tweet-generator.md",
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
  currentNoteTweetGenerator: readFileSync(
    "./prompts/current-note-tweet-generator.md",
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
  browserTopIdeasGenerator: readFileSync(
    "./prompts/browser-top-ideas.md",
    "utf-8"
  ),
  aiNewsIdeasGenerator: readFileSync(
    "./prompts/ai-news-ideas-generator.md",
    "utf-8"
  ),
  technicalTweetScoreGenerator: readFileSync(
    "./prompts/technical-tweet-score.md",
    "utf-8"
  ),
  voice: readFileSync("./prompts/voice.md", "utf-8"),
  lifeLogIdeasGenerator: readFileSync("./prompts/life-log-ideas.md", "utf-8"),
  threadToTweetGenerator: readFileSync("./prompts/thread-to-tweet.md", "utf-8"),
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
  instructions: prompts.newsThreadGenerator,
  tools: [webSearchTool()],
  model: "gpt-5",
});

export const newsTweetGenerator = new Agent({
  name: "News to Tweet Generator",
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

export const currentNoteThreadGenerator = new Agent({
  name: "Current Note to Twitter Thread Generator",
  instructions: prompts.currentNoteTweetGenerator,
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

export const browserTopIdeasGenerator = new Agent({
  name: "Browser Top Ideas Generator",
  instructions: prompts.browserTopIdeasGenerator,
  model: "gpt-5",
});

export const threadToTweetGenerator = new Agent({
  name: "Thread to Tweet Generator",
  instructions: prompts.threadToTweetGenerator,
  model: "gpt-5",
});

const TweetTopicSchema = z.object({ title: z.string(), excerpt: z.string() });

const IdeasResponseSchema = z.object({
  tweet_topics: z.array(TweetTopicSchema),
});

export const generateAiNewsIdeas = async (
  content: string
): Promise<z.infer<typeof IdeasResponseSchema>> => {
  const response = await openai.responses.parse({
    model: "gpt-5",
    input: [
      { role: "system", content: prompts.aiNewsIdeasGenerator },
      { role: "user", content: content },
    ],
    text: { format: zodTextFormat(IdeasResponseSchema, "ai-news-ideas") },
  });
  if (!response.output_parsed) throw new Error("No response parsed");
  return response.output_parsed;
};

export const generateLifeLogIdeas = async (
  content: string
): Promise<z.infer<typeof IdeasResponseSchema>> => {
  const response = await openai.responses.parse({
    model: "gpt-5",
    input: [
      { role: "system", content: prompts.lifeLogIdeasGenerator },
      { role: "user", content: content },
    ],
    text: { format: zodTextFormat(IdeasResponseSchema, "life-log-ideas") },
  });
  if (!response.output_parsed) throw new Error("No response parsed");
  return response.output_parsed;
};

const TechnicalTweetScoreResponseSchema = z.object({
  technicalScore: z.number(),
});

export const generateTechnicalTweetScore = async (
  content: string
): Promise<z.infer<typeof TechnicalTweetScoreResponseSchema>> => {
  const response = await openai.responses.parse({
    model: "gpt-5",
    input: [
      { role: "system", content: prompts.technicalTweetScoreGenerator },
      { role: "user", content: content },
    ],
    text: {
      format: zodTextFormat(
        TechnicalTweetScoreResponseSchema,
        "technical-tweet-score"
      ),
    },
  });
  if (!response.output_parsed) throw new Error("No response parsed");
  return response.output_parsed;
};
