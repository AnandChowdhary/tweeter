interface CreateDraftOptions {
  content: string;
  threadify?: boolean;
  share?: boolean;
  scheduleDate?: string | "next-free-slot";
  autoRetweetEnabled?: boolean;
  autoPlugEnabled?: boolean;
}

interface DraftResponse {
  id: string;
  content: string;
  share_url?: string;
  scheduled_at?: string;
  published_at?: string;
  status: string;
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

  const baseUrl = "https://api.typefully.com/v1";
  const url = `${baseUrl}/drafts/`;

  const payload: any = {
    content: options.content || content,
  };

  if (options.threadify !== undefined) {
    payload.threadify = options.threadify;
  }
  if (options.share !== undefined) {
    payload.share = options.share;
  }
  if (options.scheduleDate !== undefined) {
    payload["schedule-date"] = options.scheduleDate;
  }
  if (options.autoRetweetEnabled !== undefined) {
    payload.auto_retweet_enabled = options.autoRetweetEnabled;
  }
  if (options.autoPlugEnabled !== undefined) {
    payload.auto_plug_enabled = options.autoPlugEnabled;
  }

  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": `Bearer ${apiKey}`,
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Typefully API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}
