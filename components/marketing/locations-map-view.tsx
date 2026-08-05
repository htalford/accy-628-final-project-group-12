"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import {
  INDUSTRIES,
  REGION_INDUSTRY_DEMAND,
  REGIONS,
  REMOTE_LOCATION,
} from "@/lib/marketing/content";

type RegionSlug = (typeof REGIONS)[number]["slug"];

const GEO_URL = "/us-states-10m.json";

const STATE_NAME_ALIASES: Record<string, string> = {
  "District of Columbia": "Washington, D.C.",
};

function normalizeStateName(name: string) {
  return STATE_NAME_ALIASES[name] ?? name;
}

function regionForState(name: string): RegionSlug | null {
  const normalized = normalizeStateName(name);
  for (const region of REGIONS) {
    if ((region.states as readonly string[]).includes(normalized)) {
      return region.slug;
    }
  }
  return null;
}

function industryName(slug: string) {
  return INDUSTRIES.find((item) => item.slug === slug)?.name ?? slug;
}

function strengthLabel(strength: 1 | 2 | 3) {
  if (strength === 3) return "Highest demand";
  if (strength === 2) return "Strong demand";
  return "Steady demand";
}

const REGION_FILL: Record<RegionSlug, string> = {
  northeast: "#9ec5f7",
  southeast: "#7eb3f3",
  midwest: "#5a9aef",
  southwest: "#3d82e4",
  west: "#1a6fe8",
};

export function LocationsMapView() {
  const [selected, setSelected] = useState<RegionSlug | "remote" | null>(null);

  const selectedRegion = useMemo(
    () => REGIONS.find((region) => region.slug === selected) ?? null,
    [selected],
  );

  const demand =
    selected && selected !== "remote" ? REGION_INDUSTRY_DEMAND[selected] : null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <div className="rounded-2xl border border-[var(--ot-border)] bg-white p-3 shadow-sm sm:p-5">
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{ scale: 1000 }}
            width={800}
            height={500}
            className="h-auto w-full"
            style={{ width: "100%", height: "auto" }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const stateName = String(geo.properties.name ?? "");
                  const region = regionForState(stateName);
                  const isActive = region !== null && region === selected;
                  const fill = region
                    ? isActive
                      ? "#0b2545"
                      : REGION_FILL[region]
                    : "#e8f1f8";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (region) setSelected(region);
                      }}
                      style={{
                        default: {
                          fill,
                          outline: "none",
                          stroke: "#ffffff",
                          strokeWidth: 0.6,
                          cursor: region ? "pointer" : "default",
                          transition: "fill 120ms ease",
                        },
                        hover: {
                          fill: region ? "#155bc4" : fill,
                          outline: "none",
                          stroke: "#ffffff",
                          strokeWidth: 0.6,
                          cursor: region ? "pointer" : "default",
                        },
                        pressed: {
                          fill: region ? "#0b2545" : fill,
                          outline: "none",
                          stroke: "#ffffff",
                          strokeWidth: 0.6,
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          <div className="mt-3 flex flex-wrap gap-2 px-1">
            {REGIONS.map((region) => (
              <button
                key={region.slug}
                type="button"
                onClick={() => setSelected(region.slug)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  selected === region.slug
                    ? "bg-[var(--ot-navy)] text-white"
                    : "bg-[var(--ot-mist)] text-[var(--ot-navy)] hover:bg-[var(--ot-ocean)] hover:text-white"
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSelected("remote")}
            className={`mt-4 w-full rounded-xl border px-4 py-3 text-left transition ${
              selected === "remote"
                ? "border-[var(--ot-ocean)] bg-[var(--ot-mist)]"
                : "border-[var(--ot-border)] bg-white hover:border-[var(--ot-ocean)]"
            }`}
          >
            <span className="block text-sm font-semibold text-[var(--ot-navy)]">
              {REMOTE_LOCATION.name}
            </span>
            <span className="mt-1 block text-sm text-[var(--ot-muted)]">
              Click to see nationwide remote demand.
            </span>
          </button>
        </div>

        <aside className="min-h-[280px] rounded-2xl border border-[var(--ot-border)] bg-white p-6 shadow-sm">
          {!selected ? (
            <div>
              <p className="text-sm font-semibold tracking-[0.14em] text-[var(--ot-ocean)] uppercase">
                Industry demand
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ot-navy)]">
                Select a region
              </h2>
              <p className="mt-3 text-[var(--ot-muted)]">
                Click a region on the map to see which industries we staff most
                in that part of the U.S.
              </p>
            </div>
          ) : selected === "remote" ? (
            <>
              <p className="text-sm font-semibold tracking-[0.14em] text-[var(--ot-ocean)] uppercase">
                Nationwide
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ot-navy)]">
                {REMOTE_LOCATION.name}
              </h2>
              <p className="mt-3 text-[var(--ot-muted)]">
                {REMOTE_LOCATION.summary}
              </p>
              <p className="mt-6 text-sm text-[var(--ot-muted)]">
                Popular remote industries: Information Technology, Finance &
                Accounting, Human Resources, and Administrative & Clerical.
              </p>
            </>
          ) : selectedRegion && demand ? (
            <>
              <p className="text-sm font-semibold tracking-[0.14em] text-[var(--ot-ocean)] uppercase">
                Selected
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ot-navy)]">
                {selectedRegion.name}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ot-muted)]">
                {selectedRegion.states.join(" · ")}
              </p>

              <h3 className="mt-8 text-sm font-semibold tracking-[0.12em] text-[var(--ot-muted)] uppercase">
                Most popular industries here
              </h3>
              <ul className="mt-4 space-y-3">
                {demand.map((item) => (
                  <li key={item.industrySlug}>
                    <Link
                      href={`/industries#${item.industrySlug}`}
                      className="block rounded-xl border border-[var(--ot-border)] px-4 py-3 transition hover:border-[var(--ot-ocean)]"
                    >
                      <span className="block font-semibold text-[var(--ot-navy)]">
                        {industryName(item.industrySlug)}
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-sm text-[var(--ot-muted)]">
                        <span className="flex gap-1" aria-hidden>
                          {[1, 2, 3].map((dot) => (
                            <span
                              key={dot}
                              className={`h-2 w-2 rounded-full ${
                                dot <= item.strength
                                  ? "bg-[var(--ot-ocean)]"
                                  : "bg-[var(--ot-border)]"
                              }`}
                            />
                          ))}
                        </span>
                        {strengthLabel(item.strength)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>
      </div>

      <Link
        href="/"
        className="mt-10 inline-block text-sm font-semibold text-[var(--ot-ocean)] hover:underline"
      >
        ← Back to home
      </Link>
    </section>
  );
}
