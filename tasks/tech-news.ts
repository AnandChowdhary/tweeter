import { run } from "@openai/agents";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { newsTweetGenerator, voiceGenerator } from "../functions/agents";
import { fireCrawlFetch } from "../functions/fetch";
import { parseTweetsFromContent } from "../functions/response-parsers";
import { createDraft } from "../functions/schedule-tweets";
import { saveState, state } from "../functions/state";

interface RedditPost {
  approved_at_utc: number | null;
  subreddit: string;
  selftext: string;
  author_fullname: string;
  saved: boolean;
  mod_reason_title: string | null;
  gilded: number;
  clicked: boolean;
  title: string;
  link_flair_richtext: any[];
  subreddit_name_prefixed: string;
  hidden: boolean;
  pwls: number;
  link_flair_css_class: string;
  downs: number;
  thumbnail_height: number | null;
  top_awarded_type: string | null;
  hide_score: boolean;
  name: string;
  quarantine: boolean;
  link_flair_text_color: string | null;
  upvote_ratio: number;
  author_flair_background_color: string | null;
  subreddit_type: string;
  ups: number;
  total_awards_received: number;
  media_embed: Record<string, any>;
  thumbnail_width: number | null;
  author_flair_template_id: string | null;
  is_original_content: boolean;
  user_reports: any[];
  secure_media: any;
  is_reddit_media_domain: boolean;
  is_meta: boolean;
  category: string | null;
  secure_media_embed: Record<string, any>;
  link_flair_text: string;
  can_mod_post: boolean;
  score: number;
  approved_by: string | null;
  is_created_from_ads_ui: boolean;
  author_premium: boolean;
  thumbnail: string;
  edited: boolean | number;
  author_flair_css_class: string | null;
  author_flair_richtext: any[];
  gildings: Record<string, any>;
  content_categories: string | null;
  is_self: boolean;
  mod_note: string | null;
  created: number;
  link_flair_type: string;
  wls: number;
  removed_by_category: string | null;
  banned_by: string | null;
  author_flair_type: string;
  domain: string;
  allow_live_comments: boolean;
  selftext_html: string | null;
  likes: number | null;
  suggested_sort: string | null;
  banned_at_utc: number | null;
  url_overridden_by_dest?: string;
  view_count: number | null;
  archived: boolean;
  no_follow: boolean;
  is_crosspostable: boolean;
  pinned: boolean;
  over_18: boolean;
  preview?: {
    images: Array<{
      source: {
        url: string;
        width: number;
        height: number;
      };
      resolutions: Array<{
        url: string;
        width: number;
        height: number;
      }>;
      variants: Record<string, any>;
      id: string;
    }>;
    enabled: boolean;
  };
  all_awardings: any[];
  awarders: any[];
  media_only: boolean;
  link_flair_template_id: string;
  can_gild: boolean;
  spoiler: boolean;
  locked: boolean;
  author_flair_text: string | null;
  treatment_tags: any[];
  visited: boolean;
  removed_by: string | null;
  num_reports: number | null;
  distinguished: string | null;
  subreddit_id: string;
  author_is_blocked: boolean;
  mod_reason_by: string | null;
  removal_reason: string | null;
  link_flair_background_color: string;
  id: string;
  is_robot_indexable: boolean;
  report_reasons: string | null;
  author: string;
  discussion_type: string | null;
  num_comments: number;
  send_replies: boolean;
  contest_mode: boolean;
  mod_reports: any[];
  author_patreon_flair: boolean;
  author_flair_text_color: string | null;
  permalink: string;
  stickied: boolean;
  url: string;
  subreddit_subscribers: number;
  created_utc: number;
  num_crossposts: number;
  media: any;
  is_video: boolean;
  post_hint?: string;
}

interface RedditChild {
  kind: string;
  data: RedditPost;
}

interface RedditResponse {
  kind: string;
  data: {
    after: string;
    dist: number;
    modhash: string;
    geo_filter: string | null;
    children: RedditChild[];
  };
}

interface RedditComment {
  kind: string;
  data: {
    body: string;
    author: string;
    score: number;
    created_utc: number;
    replies?: {
      data: {
        children: RedditComment[];
      };
    };
  };
}

interface RedditCommentsResponse {
  kind: string;
  data: {
    children: RedditComment[];
  };
}

(async () => {
  const response = await fireCrawlFetch(
    "https://www.reddit.com/r/technews.json"
  );
  if (!response.ok)
    throw new Error(`Failed to fetch Reddit tech news: ${response.statusText}`);
  const redditData = (await response.json()) as RedditResponse;

  // Check if we have posts
  if (!redditData.data.children || redditData.data.children.length === 0) {
    console.log("No posts found");
    return;
  }

  // Filter out moderator posts, pinned posts, and meta posts
  const regularPosts = redditData.data.children.filter((child) => {
    const post = child.data;
    return (
      !post.stickied &&
      !post.distinguished &&
      !post.is_meta &&
      !post.link_flair_text?.includes("Official") &&
      !post.link_flair_text?.includes("Meta")
    );
  });

  if (regularPosts.length === 0) {
    console.log("No regular posts found (all filtered out)");
    return;
  }

  const latestPost = regularPosts[0].data;
  if (!latestPost) {
    console.log("No news found, skipping");
    return;
  }

  const isLatestAlreadyTweeted =
    state.previousRedditNewsThread === latestPost.id;
  if (isLatestAlreadyTweeted) {
    console.log("Latest news already tweeted, skipping");
    return;
  }

  let content = "News title: " + latestPost.title;
  if (latestPost.selftext) {
    content += "\n\n" + latestPost.selftext;
  }

  let comments = "";
  try {
    const commentsUrl = `https://www.reddit.com${latestPost.permalink}.json`;
    const commentsResponse = await fireCrawlFetch(commentsUrl);
    const commentsData = (await commentsResponse.json()) as [
      RedditResponse,
      RedditCommentsResponse
    ];

    const commentsArray = commentsData[1]?.data?.children || [];
    const topComments = commentsArray
      .slice(0, 10)
      .map((comment: RedditComment) => {
        const commentData = comment.data;
        if (
          commentData.body &&
          !commentData.body.includes("[deleted]") &&
          !commentData.body.includes("[removed]")
        ) {
          return `u/${commentData.author}: ${commentData.body}`;
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (topComments.length > 0) {
      comments = "\n\n--- Comments ---\n" + topComments.join("\n\n");
    }
  } catch (error) {
    console.warn("Could not fetch comments:", error);
  }

  content += comments;

  console.log("Fetching content", latestPost.url);
  const contentOriginal = await fireCrawlFetch(latestPost.url).then((res) =>
    res.text()
  );

  let articleContent = contentOriginal;
  try {
    articleContent = NodeHtmlMarkdown.translate(contentOriginal);
  } catch (error) {
    console.warn("Could not convert content to markdown:", error);
  }

  content += `\n\n---\n\nArticle content: ${articleContent}`;

  const initialResult = await run(newsTweetGenerator, content);
  if (!initialResult.finalOutput)
    throw new Error("No output from newsTweetGenerator");
  console.log("Initial result", initialResult.finalOutput.length);

  const voiceResult = await run(
    voiceGenerator,
    `Please rewrite the following tweet based on the news for an audience of technical founders with a bit of humor if needed\n\n${initialResult.finalOutput}\n\nRespond only with <tweet>...</tweet> tags for a single tweet and don't include any links or emojis.`
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
    previousRedditNewsThread: latestPost.id,
    lastDailyRunAt: new Date().toISOString(),
  });
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
