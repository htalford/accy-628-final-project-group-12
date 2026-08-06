/**
 * Industry-specific checklist options for the candidate profile.
 * Slugs align with lib/marketing/content.ts INDUSTRIES.
 */

export const EDUCATION_OPTIONS = [
  "High school diploma / GED",
  "Some college",
  "Associate degree",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate / professional degree",
  "Trade / vocational certificate",
  "Currently enrolled",
] as const;

export const YEARS_OPTIONS = [
  "Less than 1 year",
  "1–2 years",
  "3–5 years",
  "6–9 years",
  "10+ years",
] as const;

export type IndustryProfileOptions = {
  slug: string;
  name: string;
  skills: readonly string[];
  certifications: readonly string[];
  other: readonly string[];
};

export const INDUSTRY_PROFILE_OPTIONS: readonly IndustryProfileOptions[] = [
  {
    slug: "healthcare",
    name: "Healthcare & Life Sciences",
    skills: [
      "Patient care",
      "Vital signs",
      "EMR / EHR charting",
      "Phlebotomy",
      "Medication administration",
      "Triage",
      "Infection control",
      "Lab specimen handling",
      "Care coordination",
      "HIPAA compliance",
    ],
    certifications: [
      "RN license",
      "LPN license",
      "CNA",
      "BLS / CPR",
      "ACLS",
      "Medical Assistant (CMA/RMA)",
      "Phlebotomy certification",
      "Pharmacy Technician (CPhT)",
    ],
    other: [
      "Comfortable with 12-hour shifts",
      "Weekend / holiday availability",
      "Travel / float pool interest",
      "Long-term care experience",
      "Acute care / hospital experience",
      "Clinic / ambulatory experience",
    ],
  },
  {
    slug: "information-technology",
    name: "Information Technology",
    skills: [
      "Help desk / desktop support",
      "Windows / Active Directory",
      "Networking basics",
      "Cloud (AWS / Azure / GCP)",
      "SQL / data analysis",
      "Software development",
      "QA / testing",
      "Cybersecurity fundamentals",
      "Scripting (PowerShell / Python)",
      "Ticketing systems (ServiceNow / Jira)",
    ],
    certifications: [
      "CompTIA A+",
      "CompTIA Network+",
      "CompTIA Security+",
      "AWS Certified Cloud Practitioner",
      "Microsoft Certified: Azure Fundamentals",
      "Google IT Support",
      "Cisco CCNA",
      "ITIL Foundation",
    ],
    other: [
      "Remote-ready",
      "On-call / after-hours support",
      "Agile / Scrum experience",
      "Vendor management",
      "Documentation & runbooks",
    ],
  },
  {
    slug: "finance-accounting",
    name: "Finance & Accounting",
    skills: [
      "Accounts payable",
      "Accounts receivable",
      "General ledger",
      "Bank reconciliations",
      "Month-end close",
      "Payroll processing",
      "Financial reporting",
      "Excel / financial modeling",
      "ERP (NetSuite / SAP / Oracle)",
      "Audit support",
      "FP&A / budgeting",
      "Tax preparation support",
    ],
    certifications: [
      "CPA",
      "CPA candidate",
      "CMA",
      "QuickBooks Certified",
      "CB (Certified Bookkeeper)",
      "CFP",
      "EA (Enrolled Agent)",
    ],
    other: [
      "Public accounting experience",
      "Industry / private company experience",
      "Nonprofit accounting",
      "Comfortable with deadlines / close calendar",
      "Hybrid / on-site preferred",
    ],
  },
  {
    slug: "engineering-manufacturing",
    name: "Engineering & Manufacturing",
    skills: [
      "Production / assembly",
      "Quality inspection",
      "Blueprint reading",
      "Lean / continuous improvement",
      "CNC / machining",
      "PLC / automation basics",
      "CAD (SolidWorks / AutoCAD)",
      "Process documentation",
      "Preventive maintenance",
      "Root-cause analysis",
    ],
    certifications: [
      "Six Sigma Yellow / Green Belt",
      "ASQ CQT / CQE",
      "OSHA 10",
      "OSHA 30",
      "Forklift certification",
      "IPC soldering",
      "Welding certification",
    ],
    other: [
      "1st shift availability",
      "2nd / 3rd shift availability",
      "Overtime flexibility",
      "Cleanroom experience",
      "ISO / GMP environment",
    ],
  },
  {
    slug: "legal-compliance",
    name: "Legal & Compliance",
    skills: [
      "Contract review / administration",
      "Legal research",
      "Document management",
      "eDiscovery support",
      "Policy drafting",
      "Regulatory tracking",
      "Matter management",
      "Corporate records",
      "Compliance monitoring",
      "Confidentiality / privilege awareness",
    ],
    certifications: [
      "Paralegal certificate",
      "Notary public",
      "CIPP / privacy certification",
      "CAMS",
      "Certified Compliance & Ethics Professional (CCEP)",
    ],
    other: [
      "Law firm experience",
      "In-house legal experience",
      "Regulated industry (healthcare / finance)",
      "Litigation support",
      "Comfortable with deadlines",
    ],
  },
  {
    slug: "human-resources",
    name: "Human Resources",
    skills: [
      "HR generalist support",
      "Recruiting / sourcing",
      "Onboarding",
      "Benefits administration",
      "Employee relations",
      "HRIS data entry",
      "Leave / attendance tracking",
      "Policy communication",
      "Payroll coordination",
      "Training coordination",
    ],
    certifications: [
      "SHRM-CP",
      "SHRM-SCP",
      "PHR",
      "SPHR",
      "aPHR",
      "HRCI certificate",
    ],
    other: [
      "High-volume recruiting",
      "Union environment experience",
      "HRIS admin (Workday / ADP / BambooHR)",
      "Multistate employment knowledge",
      "Discretion with sensitive issues",
    ],
  },
  {
    slug: "administrative",
    name: "Administrative & Clerical",
    skills: [
      "Calendar management",
      "Customer / guest reception",
      "Phone & email triage",
      "Microsoft Office",
      "Data entry",
      "Filing / records",
      "Travel booking",
      "Meeting coordination",
      "Expense reports",
      "Office supply / vendor coordination",
    ],
    certifications: [
      "Microsoft Office Specialist",
      "Notary public",
      "Customer service certification",
      "Google Workspace proficiency",
    ],
    other: [
      "Executive support experience",
      "Front-desk / lobby coverage",
      "Bilingual",
      "Fast typist",
      "Hybrid / on-site preferred",
    ],
  },
  {
    slug: "sales-marketing",
    name: "Sales & Marketing",
    skills: [
      "Outbound prospecting",
      "Account management",
      "CRM (Salesforce / HubSpot)",
      "Pipeline management",
      "Presentation / demos",
      "Customer success",
      "Content / social support",
      "Campaign coordination",
      "Event support",
      "Market research",
    ],
    certifications: [
      "Salesforce Administrator",
      "HubSpot Inbound / Sales",
      "Google Analytics",
      "Meta / Google Ads certification",
    ],
    other: [
      "Quota-carrying experience",
      "Field / territory sales",
      "Remote sales",
      "B2B experience",
      "B2C experience",
    ],
  },
  {
    slug: "logistics",
    name: "Logistics & Supply Chain",
    skills: [
      "Receiving / shipping",
      "Pick / pack",
      "Inventory control",
      "WMS / RF scanning",
      "Dispatch coordination",
      "Procurement support",
      "Cycle counting",
      "Order fulfillment",
      "Supply-chain analysis",
      "Vendor follow-up",
    ],
    certifications: [
      "Forklift certification",
      "Hazmat awareness",
      "OSHA 10",
      "APICS / ASCM basics",
      "CDL (any class)",
    ],
    other: [
      "Night / weekend shifts",
      "Peak season flexibility",
      "Stand / lift requirements OK",
      "Cross-dock experience",
      "3PL experience",
    ],
  },
  {
    slug: "skilled-trades",
    name: "Skilled Trades & Construction",
    skills: [
      "Electrical work",
      "HVAC service",
      "General maintenance",
      "Carpentry",
      "Plumbing basics",
      "Blueprint reading",
      "Equipment troubleshooting",
      "Preventive maintenance",
      "Job-site safety",
      "Project coordination",
    ],
    certifications: [
      "Journeyman electrician",
      "Apprentice electrician",
      "EPA 608",
      "OSHA 10",
      "OSHA 30",
      "First Aid / CPR",
      "Welding certification",
    ],
    other: [
      "Valid driver's license",
      "Tools / truck available",
      "Travel to job sites",
      "Union experience",
      "Facilities / plant maintenance",
    ],
  },
] as const;

export function getIndustryProfileOptions(slug: string | null | undefined) {
  if (!slug) return null;
  return INDUSTRY_PROFILE_OPTIONS.find((i) => i.slug === slug) ?? null;
}

export function parseCommaList(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinCommaList(values: Iterable<string>): string {
  return Array.from(new Set(Array.from(values).map((s) => s.trim()).filter(Boolean))).join(", ");
}

/** Map a years label to an approximate numeric value for matching. */
export function yearsLabelToNumber(label: string | null | undefined): number | null {
  if (!label?.trim()) return null;
  const t = label.trim().toLowerCase();
  if (t.includes("less than")) return 0;
  if (t.startsWith("1")) return 2;
  if (t.startsWith("3")) return 4;
  if (t.startsWith("6")) return 8;
  if (t.startsWith("10")) return 12;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}
