import { run } from "@openai/agents";
import { blogThreadGenerator, voiceGenerator } from "../functions/agents";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";
import { saveState, state } from "../functions/state";

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
  const blogPosts = blogPostsUnsorted
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter(({ slug }) => !slug.startsWith("year-of-")); // Exclude yearly themes
  const previousIndex =
    state.previousBlogPostThread !== undefined &&
    state.previousBlogPostThread !== "none"
      ? blogPosts.findIndex(
          (post) => post.path === state.previousBlogPostThread
        )
      : -1;
  const nextIndex = previousIndex + 1;
  const nextBlogPost = blogPosts[nextIndex];
  if (!nextBlogPost) {
    console.log(
      "No more blog posts, changing state to go back to the beginning"
    );
    saveState({
      previousBlogPostThread: "none",
      lastBiWeeklyRunAt: new Date().toISOString(),
    });
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

  const initialResult = await run(blogThreadGenerator, blogPost);
  if (!initialResult.finalOutput)
    throw new Error("No output from blogThreadGenerator");

  const voiceResult = await run(
    voiceGenerator,
    `Please rewrite the following tweets based on the blog post.\n\n<blog-post>\n${blogPost}\n</blog-post>\n\n${initialResult.finalOutput}\n\nRespond only with <tweet>...</tweet> tags for the tweets in the thread. The first tweet should end with "👇" so people can click to read the rest of the thread.`
  );

  if (!voiceResult.finalOutput)
    throw new Error("No output from voiceGenerator");

  const tweets = parseTweetsFromContent(voiceResult.finalOutput);

  const draft = await createDraft({
    content: tweets,
    options: { scheduleDate: "next-free-slot", threadify: true },
  });
  console.log("Scheduled tweet", draft.id);

  saveState({
    previousBlogPostThread: nextBlogPost.path,
    lastBiWeeklyRunAt: new Date().toISOString(),
  });
})();
