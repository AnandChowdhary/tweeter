import { run } from "@openai/agents";
import {
  companyChangelogThreadGenerator,
  voiceGenerator,
} from "../functions/agents";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";
import { saveState } from "../functions/state";

(async () => {
  const rawBlogPostUrl =
    "https://docs.firstquadrant.ai/changelog/2025-08-03-memory-preview.md";
  const blogPostUrl = rawBlogPostUrl.replace(".md", "");
  console.log("Generating thread for", blogPostUrl);
  const blogPost =
    `Link: ${blogPostUrl}\n\n` +
    (await fetch(rawBlogPostUrl).then((res) => res.text()));
  console.log("Fetched blog post", blogPost.length);

  const initialResult = await run(companyChangelogThreadGenerator, blogPost);
  if (!initialResult.finalOutput)
    throw new Error("No output from companyChangelogThreadGenerator");
  console.log("Initial result", initialResult.finalOutput.length);

  const voiceResult = await run(
    voiceGenerator,
    `As the cofounder of AI sales platform FirstQuadrant, I write a weekly changelog for everything we shipped. Please rewrite the following tweets based on the changelog for this week.\n\n<changelog>\n${blogPost}\n</changelog>\n\n${initialResult.finalOutput}\n\nRespond only with <tweet>...</tweet> tags for the tweets in the thread. The first tweet can end with an emoji so people can click to read the rest of the thread, maybe something like "This week, we shipped... 👇" but you can be creative but technical (for a technical/engineering audience who is also interested in sales and business/startups).`
  );

  if (!voiceResult.finalOutput)
    throw new Error("No output from voiceGenerator");
  console.log("Voice result", voiceResult.finalOutput.length);

  const tweets = parseTweetsFromContent(voiceResult.finalOutput);
  console.log("Tweets", tweets);

  const draft = await createDraft({
    content: tweets,
    options: { scheduleDate: "next-free-slot", threadify: true },
  });
  console.log("Scheduled tweet", draft.id);

  saveState({
    previousChangelogThread: rawBlogPostUrl,
    lastWeeklyRunAt: new Date().toISOString(),
  });
})();
