import { Fraunces, DM_Sans } from "next/font/google";
import Link from "next/link";
import { demoHintsEnabled } from "@/lib/config";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export default function HomePage() {
  let hints = false;
  try {
    hints = demoHintsEnabled();
  } catch {
    hints = process.env.DEMO_LOGIN_HINTS === "true";
  }

  return (
    <main
      className={`${display.variable} ${sans.variable} relative min-h-screen overflow-hidden bg-stone-50 text-stone-900`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#ccfbf1_0%,_#fafaf9_42%,_#f5f5f4_100%)]" />
      <div className="relative mx-auto flex max-w-3xl flex-col px-5 pb-20 pt-20 sm:px-8">
        <p className="font-[family-name:var(--font-sans)] text-sm font-medium text-teal-800">
          Client Portal
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">
          Projects, files, invoices, and messages in one place.
        </h1>
        <p className="mt-4 max-w-xl font-[family-name:var(--font-sans)] text-stone-600">
          A full-stack demo portal for agencies and freelancers. Clients see only
          their work. Admins run the board.
        </p>
        <ul className="mt-8 space-y-2 font-[family-name:var(--font-sans)] text-stone-700">
          <li>Role-aware projects and messaging</li>
          <li>File uploads with scoped access</li>
          <li>EUR invoices with status flow</li>
        </ul>
        <div className="mt-10 flex flex-wrap gap-3 font-[family-name:var(--font-sans)]">
          <Link
            href="/login"
            className="rounded-xl bg-stone-900 px-5 py-3 font-medium text-white hover:bg-stone-800"
          >
            Log in
          </Link>
          <a
            href="https://github.com/EimantasSubacius/client-portal"
            className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-medium text-stone-800 hover:bg-stone-100"
          >
            GitHub
          </a>
        </div>
        {hints && (
          <p className="mt-8 text-xs text-stone-500">
            Demo: admin@demo.portal / DemoAdmin123! · client@demo.portal /
            DemoClient123!
          </p>
        )}
      </div>
    </main>
  );
}
