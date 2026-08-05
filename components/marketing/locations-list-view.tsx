import Link from "next/link";
import { REGIONS, REMOTE_LOCATION } from "@/lib/marketing/content";

/** Saved list layout — switch back via ?view=list on /locations */
export function LocationsListView() {
  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6">
      {REGIONS.map((region) => (
        <article
          key={region.slug}
          id={region.slug}
          className="scroll-mt-28 rounded-xl border border-[var(--ot-border)] bg-white p-6"
        >
          <h2 className="text-xl font-semibold text-[var(--ot-navy)]">
            {region.name}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ot-muted)]">
            {region.states.join(" · ")}
          </p>
        </article>
      ))}

      <article
        id={REMOTE_LOCATION.slug}
        className="scroll-mt-28 rounded-xl border border-[var(--ot-ocean)]/30 bg-[var(--ot-mist)] p-6"
      >
        <h2 className="text-xl font-semibold text-[var(--ot-navy)]">
          {REMOTE_LOCATION.name}
        </h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-[var(--ot-muted)]">
          {REMOTE_LOCATION.summary}
        </p>
      </article>

      <Link
        href="/"
        className="mt-2 inline-block text-sm font-semibold text-[var(--ot-ocean)] hover:underline"
      >
        ← Back to home
      </Link>
    </section>
  );
}
