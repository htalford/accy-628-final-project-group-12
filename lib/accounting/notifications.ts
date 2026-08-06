import "server-only";

import { money, shortId } from "@/lib/accounting/format";
import { listAccountingMessageThreads } from "@/lib/accounting/messages";
import {
  getAccountsReceivable,
  getContracts,
  getExpenses,
  getInvoices,
  getTimesheets,
} from "@/lib/accounting/queries";
import { getNavForRole } from "@/lib/auth/roles";
import { attentionHrefsFromNotifications } from "@/lib/nav-attention";

export type AccountingNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  time: string;
  tone: "warning" | "info" | "success";
};

export type AccountingNotificationChrome = {
  notifications: AccountingNotification[];
  navAttentionHrefs: string[];
};

const ACCOUNTING_NAV_ROOTS = getNavForRole("accounting").map((i) => i.href);

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function daysPhrase(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

/** Live action items for the accounting top-bar bell + sidebar attention dots. */
export async function loadAccountingNotifications(): Promise<AccountingNotificationChrome> {
  const [ar, timesheets, contracts, expenses, invoices, threads] =
    await Promise.all([
      getAccountsReceivable(),
      getTimesheets(),
      getContracts(),
      getExpenses(),
      getInvoices(),
      listAccountingMessageThreads().catch(() => []),
    ]);

  const items: AccountingNotification[] = [];

  const overdue = ar.rows
    .filter((r) => r.paymentStatus === "Overdue")
    .sort((a, b) => b.daysOutstanding - a.daysOutstanding);

  for (const inv of overdue.slice(0, 4)) {
    items.push({
      id: `inv-overdue-${inv.id}`,
      title: "Invoice overdue",
      body: `${inv.clientName} · ${money(inv.amountDue)} past due (${inv.daysOutstanding}d).`,
      href: `/accounting/invoices/${inv.id}`,
      time: `Due ${inv.dueDate}`,
      tone: "warning",
    });
  }

  const disputedInvoices = invoices.filter((i) => i.status === "disputed");
  for (const inv of disputedInvoices.slice(0, 3)) {
    items.push({
      id: `inv-disputed-${inv.id}`,
      title: "Disputed invoice",
      body: `${inv.clientName} · ${money(inv.amount)} needs review.`,
      href: `/accounting/invoices/${inv.id}`,
      time: `Invoice ${shortId(inv.id)}`,
      tone: "warning",
    });
  }

  const awaitingTimesheets = timesheets.filter((t) => t.status === "submitted");
  for (const ts of awaitingTimesheets.slice(0, 4)) {
    items.push({
      id: `ts-${ts.id}`,
      title: "Timesheet awaiting approval",
      body: `${ts.employeeName} · ${ts.assignment} · WE ${ts.weekEnding}.`,
      href: `/accounting/timesheets/${ts.id}`,
      time: "Timesheets",
      tone: "info",
    });
  }

  const disputedTimesheets = timesheets.filter((t) => t.status === "disputed");
  for (const ts of disputedTimesheets.slice(0, 3)) {
    items.push({
      id: `ts-disputed-${ts.id}`,
      title: "Disputed timesheet",
      body: `${ts.employeeName} · ${ts.assignment} · WE ${ts.weekEnding}.`,
      href: `/accounting/timesheets/${ts.id}`,
      time: "Timesheets",
      tone: "warning",
    });
  }

  const pendingExpenses = expenses.filter((e) => e.status === "pending");
  for (const exp of pendingExpenses.slice(0, 3)) {
    items.push({
      id: `exp-${exp.id}`,
      title: "Expense pending approval",
      body: `${exp.clientName} · ${exp.description} · ${money(exp.amount)}.`,
      href: `/accounting/expenses?focus=${exp.id}`,
      time: exp.expenseDate,
      tone: "info",
    });
  }

  const soonContracts = contracts
    .filter((c) => c.status === "active")
    .map((c) => {
      const dates = [c.guaranteeEndDate, c.endDate].filter(
        (d): d is string => Boolean(d),
      );
      if (dates.length === 0) return null;
      const nearest = dates
        .map((d) => ({ date: d, days: daysUntil(d) }))
        .filter((d) => d.days >= 0 && d.days <= 14)
        .sort((a, b) => a.days - b.days)[0];
      if (!nearest) return null;
      return { contract: c, ...nearest };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => a.days - b.days);

  for (const row of soonContracts.slice(0, 3)) {
    const label = row.contract.guaranteeEndDate === row.date
      ? "Guarantee window ending"
      : "Contract ending soon";
    items.push({
      id: `ctr-${row.contract.id}-${row.date}`,
      title: label,
      body: `${row.contract.employeeName} at ${row.contract.clientName} ends ${daysPhrase(row.days)}.`,
      href: `/accounting/contracts/${row.contract.id}`,
      time: row.date,
      tone: "warning",
    });
  }

  const unreadThreads = threads.filter((t) => t.unread > 0);
  const unreadTotal = unreadThreads.reduce((s, t) => s + t.unread, 0);
  if (unreadTotal > 0) {
    const latest = unreadThreads[0]!;
    items.push({
      id: `msg-${latest.id}`,
      title:
        unreadTotal === 1
          ? "Unread message"
          : `${unreadTotal} unread messages`,
      body: `${latest.participantName} · ${latest.subject}`,
      href: "/accounting/messages",
      time: "Messages",
      tone: "info",
    });
  }

  const notifications =
    items.length === 0
      ? [
          {
            id: "all-clear",
            title: "You're all caught up",
            body: "No overdue invoices, timesheets, expenses, or contracts need attention.",
            href: "/accounting/dashboard",
            time: "Just now",
            tone: "success" as const,
          },
        ]
      : items.slice(0, 12);

  return {
    notifications,
    navAttentionHrefs: attentionHrefsFromNotifications(
      notifications,
      ACCOUNTING_NAV_ROOTS,
    ),
  };
}
