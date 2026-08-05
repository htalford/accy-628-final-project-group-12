"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "@/lib/accounting/format";

const COLORS = ["#0b3a53", "#1f8a70", "#5b6b76", "#c45c26", "#3b82f6"];

export function RevenueChart({
  data,
}: {
  data: { month: string; amount: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--cf-muted)]">
        No revenue data yet.
      </p>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d7e0e6" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => money(Number(v))} />
          <Bar dataKey="amount" fill="#0b3a53" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InvoiceStatusChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--cf-muted)]">
        No invoice status data yet.
      </p>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {filtered.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProfitTrendChart({
  data,
}: {
  data: { month: string; revenue: number; expenses: number; profit: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--cf-muted)]">
        No trend data yet.
      </p>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d7e0e6" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => money(Number(v))} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#0b3a53" strokeWidth={2} />
          <Line type="monotone" dataKey="expenses" stroke="#5b6b76" strokeWidth={2} />
          <Line type="monotone" dataKey="profit" stroke="#1f8a70" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalProfitBars({
  data,
}: {
  data: { name: string; profit: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--cf-muted)]">
        No profitability data yet.
      </p>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d7e0e6" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => money(Number(v))} />
          <Bar dataKey="profit" fill="#1f8a70" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
