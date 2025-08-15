import FormData from "form-data";
import fetch from "node-fetch";

export interface PushoverMessageOptions {
  token: string; // required
  user: string; // required
  message: string; // required
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
  [key: string]: any; // allow additional params
}

export async function sendPushoverMessage(options: PushoverMessageOptions) {
  const { token, user, message, ...optionalParams } = options;
  const form = new FormData();
  form.append("token", token);
  form.append("user", user);
  form.append("message", message);

  // Add optional parameters if provided
  for (const [key, value] of Object.entries(optionalParams)) {
    form.append(key, value);
  }

  const response = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    body: form,
    // @ts-ignore
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Pushover API error: ${response.statusText}`);
  }

  return response.json();
}
