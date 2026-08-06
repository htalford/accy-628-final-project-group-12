import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  candidateInputFromProfile,
  requirementsForPublicJobs,
} from "@/lib/matching";
import { scoreMatch } from "@/lib/matching/score";
import { MATCH_RECRUITER_THRESHOLD } from "@/lib/matching/threshold";
import type { AppUser, EmploymentType } from "@/lib/types/database";

type JobRow = {
  id: string;
  title: string | null;
  client_id: string | null;
  employer_name: string | null;
  description: string | null;
  location: string | null;
  employment_type: EmploymentType | string | null;
  pay_rate_min: number | null;
  pay_rate_max: number | null;
  status: string | null;
};

type EmployeeRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  certifications: string | null;
  skills: string | null;
  years_experience: string | null;
  industry: string | null;
  employment_type: string | null;
  education_background: string | null;
  previous_employments: unknown;
  resume_url: string | null;
  resume_text: string | null;
};

type AppRow = {
  id: string;
  employee_id: string;
  job_id: string;
  cover_letter: string | null;
  note: string | null;
  jobs: JobRow | JobRow[] | null;
  employees: EmployeeRow | EmployeeRow[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function midPay(min: number | null, max: number | null, fallback = 45): number {
  if (min != null && max != null) return Math.round(((min + max) / 2) * 100) / 100;
  if (min != null) return Number(min);
  if (max != null) return Number(max);
  return fallback;
}

function placementPayloadFromJob(job: JobRow) {
  const pay = midPay(
    job.pay_rate_min != null ? Number(job.pay_rate_min) : null,
    job.pay_rate_max != null ? Number(job.pay_rate_max) : null,
  );
  const isPermanent = String(job.employment_type) === "permanent";
  const title = job.title ? String(job.title) : "Open role";
  const startDate = new Date().toISOString().slice(0, 10);

  if (isPermanent) {
    // Fee ≈ 15% of annualized mid pay (hourly × 2080), floor $5,000.
    const fee = Math.max(5000, Math.round(pay * 2080 * 0.15 * 100) / 100);
    return {
      placement_type: "permanent" as const,
      title,
      start_date: startDate,
      bill_rate: null as number | null,
      pay_rate: null as number | null,
      placement_fee: fee,
    };
  }

  const bill = Math.round(pay * 1.45 * 100) / 100;
  return {
    placement_type: "temp" as const,
    title,
    start_date: startDate,
    bill_rate: bill,
    pay_rate: pay,
    placement_fee: null as number | null,
  };
}

export async function scoreApplicationMatch(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<{
  score: number;
  app: AppRow;
  job: JobRow;
  employee: EmployeeRow;
  candidateName: string;
} | null> {
  const { data, error } = await supabase
    .from("applications")
    .select(
      `id, employee_id, job_id, cover_letter, note,
       jobs(id, title, client_id, employer_name, description, location, employment_type, pay_rate_min, pay_rate_max, status),
       employees(id, first_name, last_name, certifications, skills, years_experience, industry, employment_type, education_background, previous_employments, resume_url, resume_text)`,
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !data) return null;

  const app = data as unknown as AppRow;
  const job = one<JobRow>(app.jobs);
  const employee = one<EmployeeRow>(app.employees);
  if (!job || !employee) return null;

  const reqMap = await requirementsForPublicJobs([String(job.id)]);
  const req = reqMap.get(String(job.id)) ?? { skills: [], certifications: [] };

  const certs =
    employee.certifications != null
      ? String(employee.certifications)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
  const listedSkills =
    employee.skills != null
      ? String(employee.skills)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
  const summaryParts: string[] = [];
  if (app.cover_letter) summaryParts.push(String(app.cover_letter));
  if (app.note) summaryParts.push(String(app.note));
  if (employee.resume_text) summaryParts.push(String(employee.resume_text));

  const jobTitle = job.title ? String(job.title) : "Open role";
  const candidateInput = candidateInputFromProfile(employee, {
    skills: Array.from(new Set([...listedSkills, ...certs])),
    titles: [jobTitle],
    locations: job.location != null ? [String(job.location)] : [],
    profileText: summaryParts.join("\n") || null,
  });

  const match = scoreMatch(
    {
      title: jobTitle,
      description: job.description != null ? String(job.description) : null,
      location: job.location != null ? String(job.location) : null,
      employmentType:
        job.employment_type != null ? String(job.employment_type) : null,
      requiredSkills: req.skills,
      requiredCertifications: req.certifications,
    },
    candidateInput,
  );

  const candidateName =
    `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() ||
    "Candidate";

  return { score: match.score, app, job, employee, candidateName };
}

async function notifyContractParties(args: {
  supabase: SupabaseClient;
  user: AppUser;
  clientId: string;
  employeeId: string;
  candidateName: string;
  jobTitle: string;
  placementId: string;
  matchScore: number;
  employerName: string | null;
}) {
  const {
    supabase,
    user,
    clientId,
    employeeId,
    candidateName,
    jobTitle,
    placementId,
    matchScore,
    employerName,
  } = args;

  const scoreLabel = `${Math.round(matchScore)}%`;
  const shortId = placementId.slice(0, 8).toUpperCase();

  // Candidate inbox
  await supabase.from("messages").insert({
    employee_id: employeeId,
    sender_name: user.name,
    sender_role: "recruiter",
    counterpart_role: "recruiter",
    subject: `Contract ready · ${jobTitle}`,
    body: `Congratulations — your application for ${jobTitle} was accepted with a ${scoreLabel} skill match.\n\nA placement contract (${shortId}) is now available under Contracts in your portal. Please review and keep it handy for onboarding and timesheets.`,
    is_read: false,
    staff_is_read: true,
  });

  // Employer inbox (client message thread with this recruiter)
  const recruiterName = user.name || "Recruiter";
  const { data: existingEmployerThread } = await supabase
    .from("client_message_threads")
    .select("id")
    .eq("client_id", clientId)
    .eq("recruiter_name", recruiterName)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let employerThreadId = existingEmployerThread?.id as string | undefined;
  if (!employerThreadId) {
    const { data: created } = await supabase
      .from("client_message_threads")
      .insert({
        client_id: clientId,
        subject: `Messages with ${recruiterName}`,
        recruiter_name: recruiterName,
      })
      .select("id")
      .maybeSingle();
    employerThreadId = created?.id as string | undefined;
  }
  if (employerThreadId) {
    await supabase.from("client_messages").insert({
      thread_id: employerThreadId,
      sender_role: "recruiter",
      body: `${candidateName} was accepted for ${jobTitle} (${scoreLabel} match). Contract ${shortId} is available under Contracts so you can move forward with filling the role.`,
    });
    await supabase
      .from("client_message_threads")
      .update({
        updated_at: new Date().toISOString(),
        deleted_at: null,
      })
      .eq("id", employerThreadId);
  }

  // Accounting ↔ recruiter staff thread
  const { data: accountingUser } = await supabase
    .from("users")
    .select("id, name")
    .eq("role", "accounting")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (accountingUser?.id) {
    const { data: existingStaffThread } = await supabase
      .from("staff_message_threads")
      .select("id")
      .eq("recruiter_user_id", user.id)
      .eq("accounting_user_id", accountingUser.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let staffThreadId = existingStaffThread?.id as string | undefined;
    if (!staffThreadId) {
      const employerLabel = employerName?.trim() || "Employer";
      const { data: created } = await supabase
        .from("staff_message_threads")
        .insert({
          subject: `New contract · ${jobTitle} · ${employerLabel}`,
          accounting_user_id: accountingUser.id,
          recruiter_user_id: user.id,
        })
        .select("id")
        .maybeSingle();
      staffThreadId = created?.id as string | undefined;
    }

    if (staffThreadId) {
      await supabase.from("staff_messages").insert({
        thread_id: staffThreadId,
        sender_user_id: user.id,
        sender_role: "recruiter",
        body: `Accepted ${candidateName} for ${jobTitle} at ${scoreLabel} match. Contract ${shortId} is in Accounting → Contracts for billing setup and payroll.`,
      });
      await supabase
        .from("staff_message_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", staffThreadId);
    }
  }
}

/**
 * When a recruiter accepts (offers) a matched application with score ≥ 60%,
 * create an active placement contract and notify employer, candidate, and accounting.
 */
export async function createContractIfHighMatch(args: {
  supabase: SupabaseClient;
  user: AppUser;
  applicationId: string;
}): Promise<
  | {
      created: true;
      placementId: string;
      matchScore: number;
      alreadyExisted?: boolean;
    }
  | { created: false; matchScore: number | null; reason: string }
> {
  const scored = await scoreApplicationMatch(args.supabase, args.applicationId);
  if (!scored) {
    return {
      created: false,
      matchScore: null,
      reason: "Application details unavailable for matching.",
    };
  }

  const { score, job, employee, candidateName } = scored;
  if (score < MATCH_RECRUITER_THRESHOLD) {
    return {
      created: false,
      matchScore: score,
      reason: `Match score ${Math.round(score)}% is below ${MATCH_RECRUITER_THRESHOLD}%; offer recorded without a contract.`,
    };
  }

  const clientId = job.client_id != null ? String(job.client_id) : null;
  if (!clientId) {
    return {
      created: false,
      matchScore: score,
      reason: "Job has no linked employer client; cannot create a contract.",
    };
  }

  const rates = placementPayloadFromJob(job);
  const employeeId = String(employee.id);

  // Idempotent: reuse an active placement for same employer + employee + title.
  const { data: existing } = await args.supabase
    .from("placements")
    .select("id")
    .eq("client_id", clientId)
    .eq("employee_id", employeeId)
    .eq("title", rates.title)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  let placementId = existing?.id as string | undefined;
  let alreadyExisted = Boolean(placementId);

  if (!placementId) {
    const { data: inserted, error } = await args.supabase
      .from("placements")
      .insert({
        client_id: clientId,
        employee_id: employeeId,
        placement_type: rates.placement_type,
        title: rates.title,
        bill_rate: rates.bill_rate,
        pay_rate: rates.pay_rate,
        placement_fee: rates.placement_fee,
        start_date: rates.start_date,
        status: "active",
      })
      .select("id")
      .maybeSingle();

    if (error || !inserted) {
      return {
        created: false,
        matchScore: score,
        reason: error?.message ?? "Failed to create placement contract.",
      };
    }
    placementId = String(inserted.id);
  }

  // Mark the public job filled and assign the candidate.
  await args.supabase
    .from("jobs")
    .update({
      status: "filled",
      assigned_employee_id: employeeId,
    })
    .eq("id", job.id);

  await args.supabase
    .from("job_requests")
    .update({ status: "filled" })
    .eq("source_job_id", job.id);

  // Linked employer submittal (if any) → hired.
  await args.supabase
    .from("submittals")
    .update({ stage: "accepted" })
    .eq("application_id", args.applicationId);

  if (!alreadyExisted) {
    await notifyContractParties({
      supabase: args.supabase,
      user: args.user,
      clientId,
      employeeId,
      candidateName,
      jobTitle: rates.title,
      placementId,
      matchScore: score,
      employerName:
        job.employer_name != null ? String(job.employer_name) : null,
    });
  }

  return {
    created: true,
    placementId,
    matchScore: score,
    alreadyExisted,
  };
}
