import Link from "next/link";
import { LocationsListView } from "@/components/marketing/locations-list-view";
import { LocationsMapView } from "@/components/marketing/locations-map-view";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = {
  title: "Locations · TalentQuest",
  description:
    "Explore TalentQuest markets on a U.S. map, including top industries by region.",
};

type LocationsPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function LocationsPage({
  searchParams,
}: LocationsPageProps) {
  const params = await searchParams;
  const listView = params.view === "list";

  return (
    <MarketingShell>
      <section className="bg-[var(--ot-navy)] px-4 py-14 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-[var(--ot-ocean)] uppercase">
              Locations
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold">
              Where we help teams hire and candidates find work.
            </h1>
            <p className="mt-4 max-w-2xl text-white/75">
              {listView
                ? "Five regions, plus remote — pick the area that fits."
                : "Click a region to see which industries are in highest demand there."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/locations"
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                !listView
                  ? "bg-white text-[var(--ot-navy)]"
                  : "border border-white/30 text-white hover:bg-white/10"
              }`}
            >
              Map view
            </Link>
            <Link
              href="/locations?view=list"
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                listView
                  ? "bg-white text-[var(--ot-navy)]"
                  : "border border-white/30 text-white hover:bg-white/10"
              }`}
            >
              List view
            </Link>
          </div>
        </div>
      </section>

      {listView ? <LocationsListView /> : <LocationsMapView />}
    </MarketingShell>
  );
}
