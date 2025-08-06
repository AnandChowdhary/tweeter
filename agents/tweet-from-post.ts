import { Agent, run, webSearchTool } from "@openai/agents";
import { readFileSync, writeFileSync } from "node:fs";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";

const state = JSON.parse(readFileSync("./state.json", "utf-8")) as {
  previousBlogPostThread?: string;
};

const prompts = {
  tweetGenerator: readFileSync("./prompts/tweet-generator.md", "utf-8"),
  voice: readFileSync("./prompts/voice.md", "utf-8"),
};

const threadGenerator = new Agent({
  name: "Blog Post to Twitter Thread Generator",
  instructions: prompts.tweetGenerator,
  tools: [webSearchTool()],
});

const voiceGenerator = new Agent({
  name: "Rewrite in voice",
  instructions: prompts.voice,
  model: "gpt-4o",
});

(async () => {
  const blogPostsUnsorted = (await fetch(
    "https://anandchowdhary.github.io/blog/api.json"
  ).then((res) => res.json())) as {
    slug: "the-death-of-www.md";
    path: "blog/2013/the-death-of-www.md";
    source: "https://github.com/AnandChowdhary/blog/blob/main/blog/2013/the-death-of-www.md";
    title: "The Death of WWW";
    date: "2013-08-30T00:00:00.000Z";
    emoji: "🌐❌⌨️";
  }[];
  const blogPosts = blogPostsUnsorted.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const previousIndex = state.previousBlogPostThread
    ? blogPosts.findIndex((post) => post.path === state.previousBlogPostThread)
    : -1;
  const nextIndex = previousIndex + 1;
  const nextBlogPost = blogPosts[nextIndex];
  if (!nextBlogPost) {
    console.log(
      "No more blog posts, changing state to go back to the beginning"
    );
    state.previousBlogPostThread = undefined;
    writeFileSync("./state.json", JSON.stringify(state, null, 2));
    return;
  }

  const blogPostUrl =
    "https://anandchowdhary.com/" + nextBlogPost.path.replace(".md", "");
  const rawBlogPostUrl =
    "https://raw.githubusercontent.com/AnandChowdhary/blog/refs/heads/main/" +
    nextBlogPost.path;
  console.log("Generating thread for", nextBlogPost.title);
  const blogPost =
    `Link: ${blogPostUrl}\nDate: ${nextBlogPost.date}\nTitle: ${nextBlogPost.title}\n\n` +
    (await fetch(rawBlogPostUrl).then((res) => res.text()));

  const initialResult = await run(threadGenerator, blogPost);
  if (!initialResult.finalOutput)
    throw new Error("No output from threadGenerator");

  const voiceResult = await run(
    voiceGenerator,
    `Please rewrite the following tweets based on the blog post.\n\n<blog-post>\n${blogPost}\n</blog-post>\n\n${initialResult.finalOutput}\n\nRespond only with <tweet>...</tweet> tags for the tweets in the thread. The first tweet should end with "👇" so people can click to read the rest of the thread.`
  );

  if (!voiceResult.finalOutput)
    throw new Error("No output from voiceGenerator");

  const tweets = parseTweetsFromContent(voiceResult.finalOutput);

  const draft = await createDraft({
    content: tweets,
    options: { scheduleDate: "next-free-slot" },
  });
  console.log("Scheduled tweet", draft.id);

  state.previousBlogPostThread = nextBlogPost.path;
  writeFileSync("./state.json", JSON.stringify(state, null, 2));
})();
