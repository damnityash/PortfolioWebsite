import type { Metadata } from "next";
import { Suspense } from "react";
import { isAdmin } from "@/lib/auth";
import { getPortfolio } from "@/lib/backbone";
import { Editor } from "./editor";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

async function Gate() {
  if (!(await isAdmin())) return <LoginForm />;
  const portfolio = await getPortfolio();
  return <Editor initial={portfolio} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="login"><p>Loading…</p></div>}>
      <Gate />
    </Suspense>
  );
}
