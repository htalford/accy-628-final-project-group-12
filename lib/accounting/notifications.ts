export type AppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  tone: "warning" | "info" | "success";
};

/** Local sample notifications until a notifications table exists. */
export const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    title: "Invoice overdue",
    body: "Review open receivables past due date.",
    createdAt: "2h ago",
    tone: "warning",
  },
  {
    id: "n2",
    title: "Payroll ready for processing",
    body: "Approved timesheets are ready for this pay period.",
    createdAt: "5h ago",
    tone: "info",
  },
  {
    id: "n3",
    title: "Contract nearing expiration",
    body: "An active placement guarantee window ends soon.",
    createdAt: "1d ago",
    tone: "warning",
  },
  {
    id: "n4",
    title: "New expense submitted",
    body: "Expenses will appear here when recorded in Supabase.",
    createdAt: "1d ago",
    tone: "info",
  },
  {
    id: "n5",
    title: "Payment received",
    body: "A client payment was marked completed.",
    createdAt: "2d ago",
    tone: "success",
  },
];
