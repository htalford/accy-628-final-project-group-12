"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { INDUSTRIES } from "@/lib/marketing/content";
import { NavDropdown } from "@/components/marketing/nav-dropdown";

const industryItems = INDUSTRIES.map((industry) => ({
  href: `/industries#${industry.slug}`,
  label: industry.name,
}));

const aboutItems = [
  { href: "/about?tab=mission", label: "Mission Statement" },
  { href: "/about?tab=who-we-are", label: "Who We Are" },
  { href: "/about?tab=approach", label: "Our Approach" },
  { href: "/about?tab=values", label: "Values" },
  { href: "/about?tab=community", label: "Community" },
];

const careerItems = [
  {
    href: "/careers/apply",
    label: "How to Apply",
    description: "Steps to join the TalentQuest team",
  },
  {
    href: "/careers/working-here",
    label: "Working at TalentQuest",
    description: "Culture, benefits, and what to expect",
  },
  {
    href: "/careers/login",
    label: "Employee Login",
    description: "For TalentQuest staff: recruiters, managers, accounting",
  },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ot-border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-start gap-2 md:gap-4">
          <Link
            href="/"
            className="relative z-10 block shrink-0 cursor-pointer pt-0.5"
            aria-label="Go to TalentQuest home page"
            title="TalentQuest home"
          >
            <Image
              src="/talentquest-logo.png"
              alt="TalentQuest — Discover. Connect. Succeed."
              width={168}
              height={118}
              className="pointer-events-none h-14 w-auto sm:h-16"
              priority
            />
          </Link>

          <nav className="hidden items-center pt-4 md:flex" aria-label="Primary">
            <NavDropdown label="Industries We Serve" items={industryItems} />
            <NavDropdown label="About Us" items={aboutItems} />
            <NavDropdown label="Careers at TQ" items={careerItems} />
          </nav>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 pt-1">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md bg-[var(--ot-ocean)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--ot-ocean-hover)]"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--ot-navy)] underline-offset-4 hover:text-[var(--ot-ocean)] hover:underline"
          >
            Login
          </Link>
          <button
            type="button"
            className="mt-1 inline-flex items-center rounded-md border border-[var(--ot-border)] p-2 text-[var(--ot-navy)] md:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[var(--ot-border)] bg-white px-4 py-4 md:hidden">
          <p className="text-xs font-semibold tracking-wide text-[var(--ot-muted)] uppercase">
            Industries We Serve
          </p>
          <div className="mt-2 grid gap-1">
            {industryItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1.5 text-sm text-[var(--ot-navy)] hover:bg-[var(--ot-mist)]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold tracking-wide text-[var(--ot-muted)] uppercase">
            About Us
          </p>
          <div className="mt-2 grid gap-1">
            {aboutItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1.5 text-sm text-[var(--ot-navy)] hover:bg-[var(--ot-mist)]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold tracking-wide text-[var(--ot-muted)] uppercase">
            Careers at TQ
          </p>
          <div className="mt-2 grid gap-1">
            {careerItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1.5 text-sm text-[var(--ot-navy)] hover:bg-[var(--ot-mist)]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
