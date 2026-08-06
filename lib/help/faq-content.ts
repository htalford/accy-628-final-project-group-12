import type { UserRole } from "@/lib/types/database";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

/** Role-level FAQs (used when no path-specific list matches). */
export const FAQ_BY_ROLE: Record<UserRole, FaqItem[]> = {
  candidate: [
    {
      id: "cand-ot",
      question: "How is overtime calculated?",
      answer:
        "Overtime hours are billed to the client at 1.5× the regular rate. Submit OT on your timesheet; once approved, those hours flow into billing and pay for your placement.",
    },
    {
      id: "cand-timesheet",
      question: "How do I submit my timesheet?",
      answer:
        "Open Timesheets in the sidebar, enter regular and overtime hours for the week ending date, then submit. Your employer reviews and approves or rejects the entry before it flows into payroll and billing.",
    },
    {
      id: "cand-pay",
      question: "When do I get paid?",
      answer:
        "Pay is based on approved timesheets for your active placements. Check the Pay page for estimated amounts by week; once hours are approved, they are included in the next payroll cycle.",
    },
  ],
  employer: [
    {
      id: "emp-approve",
      question: "How do I approve a timesheet?",
      answer:
        "Go to Timesheets in the client portal. Open a submitted timesheet, review the hours, then Approve or Reject. Approved hours can be invoiced; rejected ones go back to the worker to correct.",
    },
    {
      id: "emp-request",
      question: "How do I request a new worker?",
      answer:
        "Open Job Requests and create a new request with title, location, headcount, and pay range. TalentQuest recruiters pick it up, submit candidates, and you review them under Candidates.",
    },
    {
      id: "emp-candidates",
      question: "Where do I review submitted candidates?",
      answer:
        "Use Candidates in the sidebar. You’ll see recruiter submittals and job-board applicants for your openings. Open a profile to Accept or Reject.",
    },
  ],
  recruiter: [
    {
      id: "rec-dash",
      question: "What do the dashboard cards show?",
      answer:
        "Open job orders, matched candidates, upcoming interviews, and recent placements. Counts refresh from live hiring activity. Use Recent Activity to see the latest pipeline changes.",
    },
    {
      id: "rec-nav",
      question: "How do I move between recruiter tabs?",
      answer:
        "Use the left sidebar (or pin frequently used tabs). Dashboard, Job Orders, Matched candidates, Interviews, Placements, Clients, Messages, and Profile each focus on one part of the staffing workflow.",
    },
    {
      id: "rec-help",
      question: "Where can I get help for a specific page?",
      answer:
        "Open this Help & FAQ panel on any Recruiter tab — the answers change to match the page you’re on (for example Job Orders vs Messages).",
    },
  ],
  accounting: [
    {
      id: "acc-expenses",
      question:
        "What’s the difference between placement expenses and operating expenses?",
      answer:
        "Placement expenses are direct costs tied to a specific placement (payroll tax, benefits, travel, recruiting, etc.) in the expenses table. Operating expenses are company overhead (salaries, rent, software, advertising) tracked separately in operating_expenses.",
    },
    {
      id: "acc-profit",
      question: "How is profitability calculated?",
      answer:
        "Gross profit is billed revenue minus direct labor (cost of services from approved timesheets). Operating income subtracts recognized operating expenses. Placement “At Risk” on Profitability highlights margins of 5% or less.",
    },
    {
      id: "acc-ar",
      question: "Where do I track what clients still owe?",
      answer:
        "Use Accounts Receivable for open invoice balances net of completed payments, or jump from Home KPI cards into Invoices and Audit Trail for recent collection activity.",
    },
  ],
};

/** Path-prefix → Recruiter FAQs (longest match wins). */
export const RECRUITER_FAQ_BY_PATH: { prefix: string; items: FaqItem[] }[] = [
  {
    prefix: "/recruiter/job-orders",
    items: [
      {
        id: "rec-jo-1",
        question: "What appears on Job Orders?",
        answer:
          "Open and filled roles from the jobs board plus employer job requests. Filter by client, status, location, or priority to focus your pipeline.",
      },
      {
        id: "rec-jo-2",
        question: "How do I work a single job order?",
        answer:
          "Open a row to see requirements, assigned candidates, match scores, and hiring progress. From the detail page you can update status and review who is submitted for that role.",
      },
      {
        id: "rec-jo-3",
        question: "What do High / Medium / Low priority mean?",
        answer:
          "Priority helps you sequence follow-up. High needs the fastest attention; Medium is standard; Low can wait behind hotter searches.",
      },
    ],
  },
  {
    prefix: "/recruiter/candidates",
    items: [
      {
        id: "rec-cand-1",
        question: "How do matched candidates work?",
        answer:
          "This list shows people who applied to open jobs with skill and certification fit scores. Strong matches can be accepted to create a contract; lower scores are flagged for recruiter review.",
      },
      {
        id: "rec-cand-2",
        question: "What if an employer rejects a candidate?",
        answer:
          "Rejected applications stay visible until you remove them. Use Remove on a rejected card (with confirmation) to permanently delete that application from lists and dashboard counts.",
      },
      {
        id: "rec-cand-2b",
        question: "How do I interview a low match score candidate?",
        answer:
          "Matches below 60% show a Needs review badge. Use Schedule interview on the card to pick an available date/time and confirm the appointment — it appears on Interviews Scheduled.",
      },
      {
        id: "rec-cand-3",
        question: "Can I compare candidates?",
        answer:
          "Select up to three candidates with the checkboxes, then Compare side by side to review skills, scores, and fit together.",
      },
    ],
  },
  {
    prefix: "/recruiter/interviews",
    items: [
      {
        id: "rec-int-1",
        question: "How do I schedule an interview?",
        answer:
          "Open a candidate from Matched candidates (or candidate details), then Schedule Interview. The time appears on this calendar and in the interview list above it.",
      },
      {
        id: "rec-int-2",
        question: "How do I move between months?",
        answer:
          "Use the left and right arrows next to the month/year header. The calendar and list stay linked to the same scheduled interviews.",
      },
      {
        id: "rec-int-3",
        question: "Can I reschedule?",
        answer:
          "Click an interview on the calendar or list, then choose a new date and time with Reschedule. The candidate record updates immediately.",
      },
    ],
  },
  {
    prefix: "/recruiter/placements",
    items: [
      {
        id: "rec-pl-1",
        question: "What placements are shown?",
        answer:
          "Placements This Month lists active, completed, and ended placements tied to your searches, with summary metrics for volume, time-to-fill, and offer acceptance.",
      },
      {
        id: "rec-pl-2",
        question: "What does At Risk mean?",
        answer:
          "At Risk flags a placement that needs attention—often thin margin or delivery risk. Follow up on hours, client feedback, and whether the role is still healthy.",
      },
      {
        id: "rec-pl-3",
        question: "How does this connect to the Manager Portal?",
        answer:
          "Once a placement is active, timesheets and billing flow to the Manager Portal. Use this tab to confirm who started and when before payroll and invoices run.",
      },
    ],
  },
  {
    prefix: "/recruiter/clients",
    items: [
      {
        id: "rec-cl-1",
        question: "What is the Clients tab?",
        answer:
          "Employers linked to your job orders and placements. Open a company to see contacts, open jobs, and placement status for that account.",
      },
      {
        id: "rec-cl-2",
        question: "What do Active and Inactive mean?",
        answer:
          "Active clients have ongoing hiring or placements. Inactive clients are not currently engaged—still visible for history, but not in your hot list.",
      },
      {
        id: "rec-cl-3",
        question: "How do I message a client?",
        answer:
          "From a client profile use Send Message, or open Messages and pick the employer conversation. Those threads sync with the Client Portal.",
      },
    ],
  },
  {
    prefix: "/recruiter/messages",
    items: [
      {
        id: "rec-msg-1",
        question: "Who can I message?",
        answer:
          "Inbox covers Employers, Candidates, and Manager. Use the filters under Inbox to narrow the conversation list.",
      },
      {
        id: "rec-msg-2",
        question: "What happens when I delete a conversation?",
        answer:
          "Delete moves the whole conversation to Deleted for 30 days. Restore it from Deleted, or it is removed from your view after retention ends.",
      },
      {
        id: "rec-msg-3",
        question: "Are messages shared with other portals?",
        answer:
          "Yes—employer threads sync with the Client Portal, candidate threads with the Candidate Portal, and Manager threads with the Manager Portal staff chat.",
      },
    ],
  },
  {
    prefix: "/recruiter/profile",
    items: [
      {
        id: "rec-pf-1",
        question: "What can I edit on Profile?",
        answer:
          "Update your recruiter display details and review performance metrics for your book of business.",
      },
      {
        id: "rec-pf-2",
        question: "Do profile changes affect logins?",
        answer:
          "Demo sign-in still uses your role email. Profile edits here are for display and metrics inside the Recruiter Portal.",
      },
    ],
  },
  {
    prefix: "/recruiter/dashboard",
    items: [
      {
        id: "rec-db-1",
        question: "How do I use the dashboard?",
        answer:
          "Summary cards jump to Job Orders, Matched candidates, Interviews, and Placements. Recent Activity shows the newest pipeline events—expand Show more for up to 10 items.",
      },
      {
        id: "rec-db-2",
        question: "Why don’t card counts match a filtered list?",
        answer:
          "Cards use overall live totals. Tab filters (status, score band, client) narrow what you see on that page without changing the dashboard snapshot until data changes.",
      },
      {
        id: "rec-db-3",
        question: "Where do I start each day?",
        answer:
          "Check Open job orders and Matched candidates first, then Interviews for anything scheduled, and Messages for employer or accounting follow-ups.",
      },
    ],
  },
  {
    prefix: "/recruiter",
    items: FAQ_BY_ROLE.recruiter,
  },
];

export function getFaqsForRole(role: UserRole, pathname?: string | null): FaqItem[] {
  if (role === "recruiter" && pathname) {
    const path = pathname.split("?")[0] ?? pathname;
    const match = RECRUITER_FAQ_BY_PATH.find((entry) =>
      path === entry.prefix || path.startsWith(`${entry.prefix}/`),
    );
    if (match) return match.items;
  }
  return FAQ_BY_ROLE[role] ?? [];
}
