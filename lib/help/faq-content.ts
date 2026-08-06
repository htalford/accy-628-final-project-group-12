import type { UserRole } from "@/lib/types/database";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

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
      id: "rec-margin",
      question: "How is placement margin calculated?",
      answer:
        "Margin compares billed revenue on a placement to direct labor cost from approved timesheets (pay × hours). Accounting’s Profitability view flags thin margins; use it with your placements list to prioritize follow-up.",
    },
    {
      id: "rec-at-risk",
      question: "What does “At Risk” mean on a placement?",
      answer:
        "At Risk is a placement status used when the engagement needs attention (for example thin margin or delivery risk). Treat it as a cue to check hours, client feedback, and whether the role is still healthy.",
    },
    {
      id: "rec-pipeline",
      question: "How do I review matched candidates?",
      answer:
        "Open Matched candidates, then a candidate’s detail page. From there you can update application status, schedule interviews, and assign approved candidates to open job orders.",
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
