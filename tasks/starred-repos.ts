import { run } from "@openai/agents";
import { starredRepoTweetGenerator, voiceGenerator } from "../functions/agents";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";
import { saveState, state } from "../functions/state";

interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: { login: string; id: number; avatar_url: string; type: string };
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
    node_id: string;
  } | null;
  allow_forking: boolean;
  is_template: boolean;
  topics: string[];
  visibility: string;
  default_branch: string;
}

(async () => {
  console.log("Fetching starred repositories...");

  const starredRepos = (await fetch(
    "https://api.github.com/users/AnandChowdhary/starred",
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "AnandChowdhary-Tweeter",
      },
    }
  ).then((res) => res.json())) as GitHubRepo[];

  if (!Array.isArray(starredRepos)) {
    console.error("Failed to fetch starred repos or invalid response format");
    return;
  }

  console.log(`Found ${starredRepos.length} starred repositories`);

  const previousStarredRepoIds = state.previousStarredRepos ?? [];
  const currentStarredRepoIds = starredRepos.map((repo) => String(repo.id));

  const newStarredRepos = starredRepos.filter(
    (repo) =>
      !previousStarredRepoIds.includes(String(repo.id)) &&
      repo.owner.login !== "AnandChowdhary"
  );

  if (newStarredRepos.length === 0) {
    console.log("No new starred repositories found, skipping");
    saveState({
      previousStarredRepos: currentStarredRepoIds,
      lastStarredReposRunAt: new Date().toISOString(),
    });
    return;
  }

  console.log(`Found ${newStarredRepos.length} new starred repositories`);

  for (const repo of newStarredRepos.slice(0, 5)) {
    console.log(`Generating thread for ${repo.full_name}`);

    let readmeContent = "";
    try {
      readmeContent = await fetch(
        `https://raw.githubusercontent.com/${repo.full_name}/HEAD/README.md`
      ).then((res) => res.text());
    } catch (error) {
      console.warn(`Could not fetch README for ${repo.full_name}:`, error);
    }

    const repoInfo = `Repository: ${repo.full_name}
Owner: ${repo.owner.login}
Description: ${repo.description || "No description provided"}
Language: ${repo.language || "Not specified"}
Stars: ${repo.stargazers_count}
Link: ${repo.html_url}
Topics: ${repo.topics.join(", ") || "None"}

README:
${readmeContent.substring(0, 5000)}`;

    const initialResult = await run(starredRepoTweetGenerator, repoInfo);

    if (!initialResult.finalOutput) {
      console.error(
        `No output from starredRepoTweetGenerator for ${repo.full_name}`
      );
      continue;
    }

    console.log("Initial result length:", initialResult.finalOutput.length);

    const voiceResult = await run(
      voiceGenerator,
      `Please rewrite the following tweets about a GitHub repository I just starred (don't explicitly mention that I just starred it, more like I'm sharing a cool project). Make it sound personal and authentic.\n\n<repository-info>\n${repoInfo}\n</repository-info>\n\n${initialResult.finalOutput}\n\nRespond only with <tweet>...</tweet> tags for the tweets in the thread. The last tweet should include the repository link.`
    );

    if (!voiceResult.finalOutput) {
      console.error(`No output from voiceGenerator for ${repo.full_name}`);
      continue;
    }

    console.log("Voice result length:", voiceResult.finalOutput.length);

    const tweets = parseTweetsFromContent(voiceResult.finalOutput);
    console.log(`Generated ${tweets.length} tweets for ${repo.full_name}`);

    const draft = await createDraft({
      content: tweets,
      options: { scheduleDate: "next-free-slot" },
    });

    console.log(`Scheduled tweet ${draft.id} for ${repo.full_name}`);
  }

  saveState({
    previousStarredRepos: currentStarredRepoIds,
    lastStarredReposRunAt: new Date().toISOString(),
  });

  console.log(`Processed ${newStarredRepos.length} new starred repositories`);
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
