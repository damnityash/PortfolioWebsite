import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

// Static password, as specified. Override with ADMIN_PASSWORD in .env.local if desired.
const password = () => process.env.ADMIN_PASSWORD ?? "yash_kulkarni";
// Cookie signing secret derived from the server-only API key (falls back to the password).
const secret = () => process.env.BACKBONE_DB_QUERY_API_KEY ?? password();

const sign = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("hex");

const safeEqual = (a: string, b: string) => {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
};

export function checkPassword(attempt: string) {
  return safeEqual(sign(attempt), sign(password()));
}

export async function startSession() {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = String(expires);
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  return Number(payload) > Date.now();
}
