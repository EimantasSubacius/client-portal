import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { demoHintsEnabled } from "@/lib/config";
import Link from "next/link";

export default function LoginPage() {
  let hints = false;
  try {
    hints = demoHintsEnabled();
  } catch {
    hints = process.env.DEMO_LOGIN_HINTS === "true";
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-16">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
          ← Home
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-stone-600">
          Use your portal credentials to continue.
        </p>
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
            <LoginForm showHints={hints} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
