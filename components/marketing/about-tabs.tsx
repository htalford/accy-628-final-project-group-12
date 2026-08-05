"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ABOUT_TABS } from "@/lib/marketing/content";

export function AboutTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const active =
    ABOUT_TABS.find((tab) => tab.id === requested)?.id ?? ABOUT_TABS[0].id;
  const current = ABOUT_TABS.find((tab) => tab.id === active) ?? ABOUT_TABS[0];

  return (
    <div>
      <div
        className="flex flex-wrap gap-2 border-b border-[var(--ot-border)] pb-3"
        role="tablist"
        aria-label="About TalentQuest"
      >
        {ABOUT_TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selected
                  ? "bg-[var(--ot-navy)] text-white"
                  : "bg-[var(--ot-mist)] text-[var(--ot-navy)] hover:bg-[var(--ot-ocean)]/10"
              }`}
              onClick={() => router.replace(`/about?tab=${tab.id}`, { scroll: false })}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="pt-8" role="tabpanel">
        <h2 className="text-2xl font-semibold text-[var(--ot-navy)]">
          {current.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--ot-muted)]">
          {current.body}
        </p>
      </div>
    </div>
  );
}
