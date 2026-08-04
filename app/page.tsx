export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex max-w-xl flex-col gap-4 text-center sm:text-left">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          ACCY 628 · Group 12
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Next.js + Supabase scaffold
        </h1>
        <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          App Router, TypeScript, and Supabase clients are ready. Deploy to
          Vercel and set the{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
            NEXT_PUBLIC_SUPABASE_*
          </code>{" "}
          env vars.
        </p>
      </main>
    </div>
  );
}
