import { run } from "@openai/agents";
import {
  openSourceProjectTweetGenerator,
  voiceGenerator,
} from "../functions/agents";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";
import { saveState, state } from "../functions/state";

(async () => {
  const openSourceProjectsUnsorted = (await fetch(
    "https://anandchowdhary.github.io/featured/repos.json"
  ).then((res) => res.json())) as {
    id: 286080143;
    node_id: "MDEwOlJlcG9zaXRvcnkyODYwODAxNDM=";
    name: "upptime";
    full_name: "upptime/upptime";
    html_url: "https://github.com/upptime/upptime";
    description: "⬆️ GitHub Actions uptime monitor & status page by @AnandChowdhary";
    created_at: "2020-08-08T16:34:41Z";
  }[];
  const openSourceProjects = openSourceProjectsUnsorted.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const previousIndex =
    state.previousOpenSourceProjectThread !== undefined &&
    state.previousOpenSourceProjectThread !== "none"
      ? openSourceProjects.findIndex(
          (post) => post.full_name === state.previousOpenSourceProjectThread
        )
      : -1;
  const nextIndex = previousIndex + 1;
  const nextopenSourceProject = openSourceProjects[nextIndex];
  if (!nextopenSourceProject) {
    console.log(
      "No more open source projects, changing state to go back to the beginning"
    );
    saveState({
      previousOpenSourceProjectThread: "none",
      lastAlternateWeeklyRunAt: new Date().toISOString(),
    });
    return;
  }

  const openSourceProjectUrl = nextopenSourceProject.html_url;
  console.log("Generating thread for", nextopenSourceProject.full_name);
  const openSourceProject =
    `Link: ${openSourceProjectUrl}\nCreated date: ${nextopenSourceProject.created_at}\nDescription: ${nextopenSourceProject.description}\nName: ${nextopenSourceProject.name}\n\n` +
    (await fetch(
      `https://raw.githubusercontent.com/${nextopenSourceProject.full_name}/HEAD/README.md`
    ).then((res) => res.text()));
  console.log("Fetched open source project", openSourceProject);

  const initialResult = await run(
    openSourceProjectTweetGenerator,
    openSourceProject
  );
  if (!initialResult.finalOutput)
    throw new Error("No output from openSourceProjectTweetGenerator");
  console.log("Initial result", initialResult.finalOutput.length);

  const voiceResult = await run(
    voiceGenerator,
    `Please rewrite the following tweets based on the open source project.\n\n<open-source-project>\n${openSourceProject}\n</open-source-project>\n\n${initialResult.finalOutput}\n\nRespond only with <tweet>...</tweet> tags for the tweets in the thread. The first tweet should end with "👇" so people can click to read the rest of the thread. The last tweet should end with "Here's the project: [link to project]"`
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

  saveState({
    previousOpenSourceProjectThread: nextopenSourceProject.full_name,
    lastAlternateWeeklyRunAt: new Date().toISOString(),
  });
})();
