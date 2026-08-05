export const INDUSTRIES = [
  {
    slug: "healthcare",
    name: "Healthcare & Life Sciences",
    summary:
      "Nurses, allied health, clinical ops, and life-science talent for hospitals, clinics, and research orgs.",
  },
  {
    slug: "information-technology",
    name: "Information Technology",
    summary:
      "Developers, analysts, cybersecurity, and IT support for digital transformation and day-to-day systems.",
  },
  {
    slug: "finance-accounting",
    name: "Finance & Accounting",
    summary:
      "Staff accountants, controllers, FP&A, and payroll specialists for close cycles and growth plans.",
  },
  {
    slug: "engineering-manufacturing",
    name: "Engineering & Manufacturing",
    summary:
      "Mechanical, industrial, and quality engineers plus skilled production roles on the plant floor.",
  },
  {
    slug: "legal-compliance",
    name: "Legal & Compliance",
    summary:
      "Paralegals, contract specialists, and compliance professionals for regulated industries.",
  },
  {
    slug: "human-resources",
    name: "Human Resources",
    summary:
      "HR generalists, recruiters, and people-ops leaders who keep teams running smoothly.",
  },
  {
    slug: "administrative",
    name: "Administrative & Clerical",
    summary:
      "Executive assistants, office coordinators, and reception teams that keep operations moving.",
  },
  {
    slug: "sales-marketing",
    name: "Sales & Marketing",
    summary:
      "Business development, account management, and marketing talent that grow revenue pipelines.",
  },
  {
    slug: "logistics",
    name: "Logistics & Supply Chain",
    summary:
      "Warehouse, dispatch, procurement, and supply-chain analysts for distribution networks.",
  },
  {
    slug: "skilled-trades",
    name: "Skilled Trades & Construction",
    summary:
      "Electricians, technicians, and project support for construction and facilities work.",
  },
] as const;

export const REGIONS = [
  {
    slug: "northeast",
    name: "Northeast",
    states: [
      "Connecticut",
      "Delaware",
      "Maine",
      "Maryland",
      "Massachusetts",
      "New Hampshire",
      "New Jersey",
      "New York",
      "Pennsylvania",
      "Rhode Island",
      "Vermont",
    ],
  },
  {
    slug: "southeast",
    name: "Southeast",
    states: [
      "Alabama",
      "Arkansas",
      "Florida",
      "Georgia",
      "Kentucky",
      "Louisiana",
      "Mississippi",
      "North Carolina",
      "South Carolina",
      "Tennessee",
      "Virginia",
      "West Virginia",
      "Washington, D.C.",
    ],
  },
  {
    slug: "midwest",
    name: "Midwest",
    states: [
      "Illinois",
      "Indiana",
      "Iowa",
      "Kansas",
      "Michigan",
      "Minnesota",
      "Missouri",
      "Nebraska",
      "North Dakota",
      "Ohio",
      "South Dakota",
      "Wisconsin",
    ],
  },
  {
    slug: "southwest",
    name: "Southwest",
    states: [
      "Arizona",
      "New Mexico",
      "Oklahoma",
      "Texas",
    ],
  },
  {
    slug: "west",
    name: "West",
    states: [
      "Alaska",
      "California",
      "Colorado",
      "Hawaii",
      "Idaho",
      "Montana",
      "Nevada",
      "Oregon",
      "Utah",
      "Washington",
      "Wyoming",
    ],
  },
] as const;

export const REMOTE_LOCATION = {
  slug: "remote",
  name: "Remote / nationwide",
  summary:
    "Fully remote and hybrid roles available across the U.S. — no single-region requirement.",
} as const;

/** Top industries by demand in each region (demo data for the map view). */
export const REGION_INDUSTRY_DEMAND: Record<
  (typeof REGIONS)[number]["slug"],
  { industrySlug: (typeof INDUSTRIES)[number]["slug"]; strength: 1 | 2 | 3 }[]
> = {
  northeast: [
    { industrySlug: "finance-accounting", strength: 3 },
    { industrySlug: "healthcare", strength: 3 },
    { industrySlug: "information-technology", strength: 2 },
    { industrySlug: "legal-compliance", strength: 2 },
  ],
  southeast: [
    { industrySlug: "healthcare", strength: 3 },
    { industrySlug: "logistics", strength: 3 },
    { industrySlug: "administrative", strength: 2 },
    { industrySlug: "sales-marketing", strength: 2 },
  ],
  midwest: [
    { industrySlug: "engineering-manufacturing", strength: 3 },
    { industrySlug: "skilled-trades", strength: 3 },
    { industrySlug: "logistics", strength: 2 },
    { industrySlug: "finance-accounting", strength: 2 },
  ],
  southwest: [
    { industrySlug: "healthcare", strength: 3 },
    { industrySlug: "skilled-trades", strength: 3 },
    { industrySlug: "information-technology", strength: 2 },
    { industrySlug: "logistics", strength: 2 },
  ],
  west: [
    { industrySlug: "information-technology", strength: 3 },
    { industrySlug: "healthcare", strength: 2 },
    { industrySlug: "sales-marketing", strength: 2 },
    { industrySlug: "human-resources", strength: 2 },
  ],
};

export const ABOUT_TABS = [
  {
    id: "mission",
    label: "Mission",
    title: "Our mission",
    body: "TalentQuest exists to discover great people, connect them with the right organizations, and help both sides succeed. We believe staffing should feel personal, transparent, and built on trust — from the first conversation through placement and beyond.",
  },
  {
    id: "who-we-are",
    label: "Who We Are",
    title: "A staffing partner, not a résumé mill",
    body: "We are a full-service staffing agency supporting temporary, contract-to-hire, and permanent placements. Our recruiters specialize by industry so clients get people who fit the work, the culture, and the timeline — not just a keyword match.",
  },
  {
    id: "approach",
    label: "Our Approach",
    title: "Discover. Connect. Succeed.",
    body: "We start by understanding the role and the team. Then we source, screen, and present candidates who are ready to contribute. After placement, we stay involved — timesheets, check-ins, and support — so contracts convert into lasting results.",
  },
  {
    id: "values",
    label: "Values",
    title: "Talent Quest values",
    body: "Trust first. Clear communication. Respect for every candidate and client. We measure success by quality of hire, reliability on assignment, and relationships that last longer than a single requisition.",
  },
  {
    id: "community",
    label: "Community",
    title: "Invested in the people we place",
    body: "We partner with local employers, schools, and workforce programs to open pathways into healthcare, skilled trades, office, and professional roles. When our community grows, our clients do too.",
  },
] as const;
