"use client";

import { useState } from "react";
import { INDUSTRIES } from "@/lib/marketing/content";

const INTEREST_OPTIONS = [
  { value: "hire", label: "Looking to hire" },
  { value: "work", label: "Looking for work" },
] as const;

type Interest = (typeof INTEREST_OPTIONS)[number]["value"];

const RECRUITER_EMAIL = "recruiter@talentquest.com";

export function SignupForm() {
  const [interest, setInterest] = useState<Interest | "">("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (interest !== "hire" && interest !== "work") {
      setError("Please choose whether you are looking to hire or looking for work.");
      return;
    }

    if (!name.trim() || !email.trim() || !industry) {
      setError("Please fill in all required fields.");
      return;
    }

    if (interest === "hire" && !companyName.trim()) {
      setError("Please enter your company or organization name.");
      return;
    }

    const interestLabel =
      interest === "hire" ? "Looking to hire" : "Looking for work";

    const lines = [
      "New TalentQuest account request",
      "",
      `Interest: ${interestLabel}`,
      `Name: ${name.trim()}`,
      interest === "hire"
        ? `Company / organization: ${companyName.trim()}`
        : null,
      `Industry: ${industry}`,
      `Email: ${email.trim()}`,
      "",
      "Please follow up to create their account.",
    ].filter(Boolean);

    const subject = `Account request — ${name.trim()} (${interestLabel})`;
    const href = `mailto:${RECRUITER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;

    window.location.href = href;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-3 text-sm leading-relaxed text-[var(--ot-muted)]">
        <p className="font-medium text-[var(--ot-navy)]">
          Your request is ready to send.
        </p>
        <p>
          Your email app should open with a message to{" "}
          <span className="font-medium text-[var(--ot-navy)]">
            {RECRUITER_EMAIL}
          </span>
          . Send that message and a recruiter will follow up to create your
          account.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="font-semibold text-[var(--ot-ocean)] hover:underline"
        >
          Edit and try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ot-navy)]">I am...</span>
        <select
          required
          value={interest}
          onChange={(e) => setInterest(e.target.value as Interest | "")}
          className="rounded-md border border-[var(--ot-border)] bg-white px-3 py-2 text-[var(--ot-navy)] outline-none ring-[var(--ot-ocean)] focus:ring-2"
        >
          <option value="" disabled>
            Select one
          </option>
          {INTEREST_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ot-navy)]">Full name</span>
        <input
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-[var(--ot-border)] bg-white px-3 py-2 text-[var(--ot-navy)] outline-none ring-[var(--ot-ocean)] focus:ring-2"
        />
      </label>

      {interest === "hire" ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--ot-navy)]">
            Company / organization name
          </span>
          <input
            type="text"
            autoComplete="organization"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="rounded-md border border-[var(--ot-border)] bg-white px-3 py-2 text-[var(--ot-navy)] outline-none ring-[var(--ot-ocean)] focus:ring-2"
          />
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ot-navy)]">Industry</span>
        <select
          required
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-md border border-[var(--ot-border)] bg-white px-3 py-2 text-[var(--ot-navy)] outline-none ring-[var(--ot-ocean)] focus:ring-2"
        >
          <option value="" disabled>
            Select an industry
          </option>
          {INDUSTRIES.map((item) => (
            <option key={item.slug} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ot-navy)]">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-[var(--ot-border)] bg-white px-3 py-2 text-[var(--ot-navy)] outline-none ring-[var(--ot-ocean)] focus:ring-2"
        />
      </label>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-1 rounded-md bg-[var(--ot-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Email recruiter
      </button>

      <p className="text-xs leading-relaxed text-[var(--ot-muted)]">
        Submitting opens an email to {RECRUITER_EMAIL} with your details. A
        recruiter will create your account after they receive it.
      </p>
    </form>
  );
}
