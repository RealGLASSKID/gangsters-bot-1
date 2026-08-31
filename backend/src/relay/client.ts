import { config } from "../config";

export class RelayError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "RelayError";
  }
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<{ id: string }> {
  if (!config.relay.apiKey) {
    throw new Error("RELAY_API_KEY is not configured");
  }

  const res = await fetch(`${config.relay.url}/api/v1/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.relay.apiKey}`,
    },
    body: JSON.stringify({ to, message }),
  });

  const body = (await res.json().catch(() => null)) as { data?: { id: string }; error?: { message?: string } } | null;

  if (!res.ok) {
    const msg = body?.error?.message || `Relay send failed with status ${res.status}`;
    throw new RelayError(msg, res.status);
  }

  return body!.data as { id: string };
}
