import { run } from "@openai/agents";
import { generateLifeLogIdeas, voiceGenerator } from "../functions/agents";
import { parseTweetsFromContentAsArray } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";
import { saveState } from "../functions/state";

(async () => {
  // Last 10 days
  let content = "";
  let today = new Date();
  for (let i = 0; i < 10; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);

    try {
      const response = await fetch(
        `https://api.github.com/repos/AnandChowdhary/life-logs/contents/data/${
          targetDate.toISOString().split("T")[0]
        }.md`,
        { headers: { Authorization: `Bearer ${process.env.GH_PAT}` } }
      );
      const data = await response.text();
      const json = JSON.parse(data);
      const plainText = Buffer.from(json.content, "base64").toString("utf-8");
      content += `\n\n${plainText}`;
    } catch (error) {
      console.error(
        `Error fetching life log for ${targetDate.toISOString()}: ${error}, continuing...`
      );
    }
  }

  if (content.length < 500) {
    console.error("Not enough content to generate quotes, skipping");
    saveState({ lastWeeklyQuotesRunAt: new Date().toISOString() });
    return;
  }

  const ideas = await generateLifeLogIdeas(content);
  const allIdeas = ideas.tweet_topics
    .map((i) => `Quote: ${i.title}\nExplanation: ${i.excerpt}`)
    .join("\n\n");

  const voiceResult = await run(
    voiceGenerator,
    `These are some ideas for quotes to post on Twitter. The idea is to do thought leadership on Twitter like Naval Ravikant or Paul Graham and sometimes randomly post a life lesson, learning, or a powerful quote that is original to me as a short tweet with no other context. Please select the best ideas (no more than 5) and respond with <tweet>...</tweet> tags for the tweets, one for each tweet. It should be a short tweet in sentence case with 1-2 sentences.\n\nHere are the previous tweets for inspiration:\n - De‑risk before you leap. Side projects plus a stable salary buy the resource founders need most: mental space. If you raise, raise enough to pay yourself a baseline. You'll make better calls when rent isn't in the prompt.\n - Hire fewer, higher‑leverage builders. Four "cheap" devs rarely equal one elite engineer. As AI handles the average work, the premium is judgment, communication, and taste. A tiny team of killers + agents beats a platoon of passengers.\n - AI UX isn't a chat box. The lazy way to "add AI" is a text field, but the best way is invisible: models doing the work under the hood so users don't have to.\n\nPlease generate tweets from these new ideas:\n\n${allIdeas}`
  );

  if (!voiceResult.finalOutput) {
    console.error(`No output from voiceGenerator for ${content.length}`);
    return;
  }

  console.log("Voice result length:", voiceResult.finalOutput.length);

  const tweets = parseTweetsFromContentAsArray(voiceResult.finalOutput);
  console.log("Tweets", tweets);

  let start = new Date();
  for (const tweet of tweets) {
    start.setDate(start.getDate() + 1);
    start.setHours(
      1,
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

  saveState({ lastWeeklyQuotesRunAt: new Date().toISOString() });
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
