import { readFileSync, writeFileSync } from "node:fs";

export const state = JSON.parse(
  readFileSync("./state.json", "utf-8") || "{}"
) as {
  previousBlogPostThread?: string;
  previousChangelogThread?: string;
  previousSmolAiNewsThread?: string;
  lastBiWeeklyRunAt: string;
  lastDailyRunAt: string;
  lastWeeklyRunAt: string;
  lastTriWeeklyRunAt: string;
  previousNotesPostThread?: string;
  previousOpenSourceProjectThread?: string;
  lastAlternateWeeklyRunAt: string;
  previousStarredRepos?: string[];
  lastStarredReposRunAt?: string;
  lastWeeklyQuotesRunAt?: string;
};

export function saveState(newState: Partial<typeof state>) {
  writeFileSync(
    "./state.json",
    JSON.stringify({ ...state, ...newState }, null, 2) + "\n"
  );
}
