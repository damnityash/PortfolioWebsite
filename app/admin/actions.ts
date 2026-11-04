"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { checkPassword, endSession, isAdmin, startSession } from "@/lib/auth";
import { PORTFOLIO_TAG, savePortfolio } from "@/lib/backbone";
import { normalizePortfolio } from "@/lib/portfolio";

export type LoginState = { error?: string };
export type SaveState = { ok: boolean; message: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const attempt = String(formData.get("password") ?? "");
  if (!checkPassword(attempt)) {
    return { error: "That password is incorrect. Try again." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin");
}

export async function savePortfolioAction(json: string): Promise<SaveState> {
  if (!(await isAdmin())) {
    return { ok: false, message: "Your session expired. Reload and sign in again." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, message: "The JSON is not valid. Fix the syntax and save again." };
  }
  const data = normalizePortfolio(parsed);
  if (!data.name) {
    return { ok: false, message: "Name is required." };
  }
  try {
    await savePortfolio(data);
  } catch (err) {
    console.error("[admin] save failed:", err);
    return { ok: false, message: "Saving to the backend failed. Check the connection and try again." };
  }
  updateTag(PORTFOLIO_TAG);
  return { ok: true, message: "Saved. The site is updated." };
}
