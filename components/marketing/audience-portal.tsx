"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Building2, MapPin } from "lucide-react";
import { JobSearchBar } from "@/components/marketing/job-search-bar";

type Portal = "businesses" | "seekers" | null;

export function AudiencePortal() {
  const [portal, setPortal] = useState<Portal>(null);

  return (
    <section className="border-y border-[var(--ot-border)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--ot-navy)] sm:text-4xl">
            Choose your path
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-[var(--ot-muted)]">
            Pick who you are — we&apos;ll show the next steps that match.
          </p>
        </div>

        <div className="mt-8 grid items-start gap-4 md:grid-cols-2">
          <div
            className={`rounded-2xl border px-6 py-7 transition ${
              portal === "businesses"
                ? "border-[var(--ot-navy)] bg-[var(--ot-navy)] text-white shadow-lg"
                : "border-[var(--ot-border)] bg-[var(--ot-mist)]/40 text-[var(--ot-ink)]"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setPortal((current) =>
                  current === "businesses" ? null : "businesses",
                )
              }
              className="flex w-full flex-col items-start gap-3 text-left"
            >
              <Building2
                className={`h-7 w-7 ${
                  portal === "businesses"
                    ? "text-[var(--ot-ocean)]"
                    : "text-[var(--ot-navy)]"
                }`}
              />
              <span className="text-xl font-semibold tracking-tight">
                For businesses
              </span>
              <span
                className={`text-sm ${
                  portal === "businesses"
                    ? "text-white/75"
                    : "text-[var(--ot-muted)]"
                }`}
              >
                Explore industries we staff and where we operate.
              </span>
            </button>

            {portal === "businesses" ? (
              <div className="mt-5 border-t border-white/20 pt-5">
                <p className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
                  Business resources
                </p>
                <div className="mt-3 grid gap-2">
                  <Link
                    href="/industries"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <Briefcase className="h-4 w-4 text-[var(--ot-ocean)]" />
                    Industries
                  </Link>
                  <Link
                    href="/locations"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <MapPin className="h-4 w-4 text-[var(--ot-ocean)]" />
                    Locations
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className={`rounded-2xl border px-6 py-7 transition ${
              portal === "seekers"
                ? "border-[var(--ot-navy)] bg-[var(--ot-navy)] text-white shadow-lg"
                : "border-[var(--ot-border)] bg-[var(--ot-mist)]/40 text-[var(--ot-ink)]"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setPortal((current) =>
                  current === "seekers" ? null : "seekers",
                )
              }
              className="flex w-full flex-col items-start gap-3 text-left"
            >
              <Briefcase
                className={`h-7 w-7 ${
                  portal === "seekers"
                    ? "text-[var(--ot-ocean)]"
                    : "text-[var(--ot-navy)]"
                }`}
              />
              <span className="text-xl font-semibold tracking-tight">
                For job seekers
              </span>
              <span
                className={`text-sm ${
                  portal === "seekers"
                    ? "text-white/75"
                    : "text-[var(--ot-muted)]"
                }`}
              >
                Search openings by title, location, and distance.
              </span>
            </button>
          </div>
        </div>

        {portal === "seekers" ? (
          <div className="mt-6">
            <JobSearchBar />
          </div>
        ) : null}
      </div>
    </section>
  );
}
