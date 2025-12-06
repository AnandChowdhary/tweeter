import { sendPushoverMessage } from "./pushover";

interface CreateDraftOptions {
  content: string;
  threadify?: boolean;
  share?: boolean;
  scheduleDate?: string | "next-free-slot";
  autoRetweetEnabled?: boolean;
  autoPlugEnabled?: boolean;
}

interface PlatformPost {
  text: string;
  media_ids?: string[];
}

interface PlatformSettings {
  reply_to_url?: string;
}

interface PlatformConfig {
  enabled: boolean;
  posts: PlatformPost[];
  settings?: PlatformSettings;
}

interface DraftResponse {
  id: number;
  social_set_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  scheduled_date?: string;
  published_at?: string;
  draft_title?: string;
  tags?: string[];
  preview?: string;
  share_url?: string;
  platforms: {
    x?: PlatformConfig;
    linkedin?: PlatformConfig;
    mastodon?: PlatformConfig;
    threads?: PlatformConfig;
    bluesky?: PlatformConfig;
  };
  x_published_url?: string;
  linkedin_published_url?: string;
  mastodon_published_url?: string;
  threads_published_url?: string;
  bluesky_published_url?: string;
  x_post_published_at?: string;
}

/**
 * Create a draft using Typefully API
 */
export async function createDraft({
  content,
  options = {},
}: {
  content: string;
  options?: Partial<CreateDraftOptions>;
}): Promise<DraftResponse> {
  const apiKey = process.env.TYPEFULLY_API_KEY;
  if (!apiKey) {
    throw new Error("TYPEFULLY_API_KEY environment variable is not set");
  }
  const socialSetId = "31080";

  const pushoverApiKey = process.env.PUSHOVER_API_KEY;
  if (!pushoverApiKey) {
    throw new Error("PUSHOVER_API_KEY environment variable is not set");
  }

  const pushoverUserKey = process.env.PUSHOVER_USER_KEY;
  if (!pushoverUserKey) {
    throw new Error("PUSHOVER_USER_KEY environment variable is not set");
  }

  const baseUrl = "https://api.typefully.com/v2";
  const url = `${baseUrl}/social-sets/${socialSetId}/drafts`;

  // Build the payload in the new v2 format
  const payload: any = {
    platforms: {
      x: {
        enabled: true,
        posts: [
          {
            text: options.content || content,
          },
        ],
      },
    },
  };

  // Add settings if needed (e.g., reply_to_url)
  if (options.share !== undefined || options.scheduleDate !== undefined) {
    payload.platforms.x.settings = {};
    // Note: Some old options may not have direct equivalents in v2 API
    // scheduleDate might need to be handled differently in v2
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Typefully API error: ${response.status} ${text}`);
  }
  const result = await response.json();

  try {
    const tweetText = payload.platforms.x.posts[0].text;
    await sendPushoverMessage({
      token: pushoverApiKey,
      user: pushoverUserKey,
      message: `Please edit and approve the scheduled tweet: ${tweetText.slice(
        0,
        100
      )}...`,
      url: "https://typefully.com",
      url_title: "Edit and approve tweet",
    });
  } catch (error) {
    // Skip erros in notifications
  }

  return result;
}
