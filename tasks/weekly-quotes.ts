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
    today.setDate(today.getDate() - i);

    try {
      const response = await fetch(
        `https://api.github.com/repos/AnandChowdhary/life-logs/contents/data/${
          today.toISOString().split("T")[0]
        }.md`,
        { headers: { Authorization: `Bearer ${process.env.GH_PAT}` } }
      );
      const data = await response.text();
      const json = JSON.parse(data);
      const plainText = Buffer.from(json.content, "base64").toString("utf-8");
      content += `\n\n${plainText}`;
    } catch (error) {
      console.error(
        `Error fetching life log for ${today.toISOString()}: ${error}, continuing...`
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
    `These are some ideas for quotes to post on Twitter. The idea is to do thought leadership on Twitter like Naval Ravikant or Paul Graham and sometimes randomly post a life lesson, learning, or a powerful quote that is original to me as a short tweet with no other context. Please select the best ideas (no more than 5) and respond with <tweet>...</tweet> tags for the tweets, one for each tweet:\n\n${allIdeas}`
  );

  if (!voiceResult.finalOutput) {
    console.error(`No output from voiceGenerator for ${content.length}`);
    return;
  }

  console.log("Voice result length:", voiceResult.finalOutput.length);

  const tweets = parseTweetsFromContentAsArray(voiceResult.finalOutput);
  console.log("Tweets", tweets);

  let start = new Date();
  start.setHours(0, 0, 0, 0);
  for (const tweet of tweets) {
    start.setDate(start.getDate() + 1);
    const scheduleDate = start.toISOString();

    const draft = await createDraft({
      content: tweet,
      options: { scheduleDate },
    });
    console.log("Scheduled tweet", draft.id);
  }

  saveState({ lastWeeklyQuotesRunAt: new Date().toISOString() });
})();
