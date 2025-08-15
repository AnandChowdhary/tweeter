import FormData from "form-data";
import fetch from "node-fetch";

export interface PushoverMessageOptions {
  token: string;
  user: string;
  message: string;
  attachment?: Buffer | Blob | File | string;
  attachment_base64?: string;
  attachment_type?: string;
  device?: string;
  html?: 0 | 1;
  priority?: -2 | -1 | 0 | 1 | 2;
  sound?: string;
  timestamp?: number;
  title?: string;
  ttl?: number;
  url?: string;
  url_title?: string;
  [key: string]: any;
}

export async function sendPushoverMessage(options: PushoverMessageOptions) {
  const { token, user, message, ...optionalParams } = options;
  const form = new FormData();
  form.append("token", token);
  form.append("user", user);
  form.append("message", message);

  for (const [key, value] of Object.entries(optionalParams))
    form.append(key, value);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      body: form,

      headers: form.getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Pushover API error: ${response.statusText}`);
    }

    return;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Pushover API request timed out after 10 seconds");
    }
    throw error;
  }
}
