"use server";

import { headers } from "next/headers";
import { postContact } from "@/lib/api";

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string; fields?: Record<string, string[]>; values: Record<string, string> };

const FIELDS = ["name", "email", "company", "budget", "message", "website"] as const;

export async function sendMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  const values = Object.fromEntries(FIELDS.map((k) => [k, String(form.get(k) ?? "").trim()])) as Record<string, string>;

  // Honeypot filled → pretend success, store nothing.
  if (values.website) return { status: "success", name: values.name };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
  try {
    const res = await postContact(values, ip);
    if (res.ok) return { status: "success", name: values.name.split(" ")[0] || values.name };
    return {
      status: "error",
      message: res.body?.error?.message ?? "Something went wrong. Please try again.",
      fields: res.body?.error?.details ?? undefined,
      values,
    };
  } catch {
    return { status: "error", message: "The server didn’t answer. Please try again, or email me directly.", values };
  }
}
