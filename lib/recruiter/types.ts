/** Recruiter portal view models — backed by Supabase jobs/applications/placements. */

import type {
  ApplicationStatus,
  JobStatus,
} from "@/lib/types/database";

export type PipelineStatus =
  | "Applied"
  | "Approved"
  | "Interview Scheduled"
  | "Interview Complete"
  | "Client Review"
  | "Offer Sent"
  | "Hired"
  | "Rejected";

export type JobOrderStatus = "Open" | "Interviewing" | "Filled" | "Closed";
export type JobPriority = "High" | "Medium" | "Low";

export type InterviewType = "Virtual" | "Phone" | "In Person";
export type InterviewStatus =
  | "Scheduled"
  | "Completed"
  | "Cancelled"
  | "Rescheduled";

export type PlacementStatusUi =
  | "Starting Soon"
  | "Active"
  | "Completed"
  | "Extended"
  | "Ended";

export type PlacementTypeUi = "Temp" | "Permanent";

export type ActivityKind =
  | "stage_moved"
  | "interview_scheduled"
  | "placement_completed"
  | "job_order_created"
  | "offer_accepted";

export type JobNote = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
};

export type CandidateSource =
  | "application"
  | "employer_submittal"
  | "job_interest";
export type JobOrderSource = "public_job" | "employer_request";

export type RecruiterCandidate = {
  id: string;
  /** Application id when sourced from applications table */
  applicationId: string | null;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  positionApplied: string;
  jobId: string | null;
  jobTitle: string | null;
  experienceYears: number;
  status: PipelineStatus;
  applicationStatus: ApplicationStatus | null;
  skills: string[];
  location: string;
  recruiter: string;
  lastUpdated: string;
  education: string;
  notes: string;
  resumeUrl: string | null;
  /** Extracted resume body for automated matching (when available). */
  resumeText?: string | null;
  /** Previous roles from the candidate portal profile. */
  previousEmployments?: import("@/lib/types/database").PreviousEmployment[] | null;
  interviewAt: string | null;
  interviewType: InterviewType | null;
  interviewNotes: string | null;
  interviewHistory: {
    id: string;
    date: string;
    type: InterviewType;
    outcome: string;
  }[];
  /** application = Candidate Portal; employer_submittal = Client Portal submittals; job_interest = interested (often low match) */
  source: CandidateSource;
  /** 0–100 automated match vs linked job / job request (when scorable). */
  matchPercent?: number | null;
  matchBand?: import("@/lib/matching/score").MatchBand | null;
};

export type RecruiterJobOrder = {
  id: string;
  title: string;
  clientId: string | null;
  client: string;
  employerName: string;
  primaryContact: string;
  company: string;
  location: string;
  status: JobOrderStatus;
  dbStatus: JobStatus;
  openPositions: number;
  filledPositions: number;
  priority: JobPriority;
  description: string;
  requiredSkills: string[];
  /** Required certs from employer job_requests when linked. */
  requiredCertifications: string[];
  payRate: number;
  billRate: number;
  assignedRecruiter: string;
  contractSummary: string;
  assignedCandidateIds: string[];
  assignedEmployeeId: string | null;
  interviewProgress: string;
  notes: string;
  recruiterNotes: JobNote[];
  /** public_job = jobs board; employer_request = Client Portal job_requests */
  source: JobOrderSource;
};

export type RecruiterInterview = {
  id: string;
  applicationId: string;
  candidate: string;
  candidateId: string;
  company: string;
  position: string;
  jobOrderId: string;
  date: string;
  time: string;
  datetime: string;
  type: InterviewType;
  recruiter: string;
  status: InterviewStatus;
  notes: string | null;
};

export type RecruiterPlacement = {
  id: string;
  candidate: string;
  client: string;
  job: string;
  placementType: PlacementTypeUi;
  startDate: string;
  endDate: string | null;
  status: PlacementStatusUi;
  recruiter: string;
  payrollStatus: string;
  timesheetStatus: string;
  clientContact: string;
  notes: string;
};

export type RecruiterClient = {
  id: string;
  company: string;
  primaryContact: string;
  phone: string;
  email: string;
  openJobs: number;
  activePlacements: number;
  lastContact: string;
  industry: string | null;
  status: string;
};

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  timestamp: string;
  description: string;
};

export type DashboardMetrics = {
  openJobOrders: number;
  candidatesInPipeline: number;
  upcomingInterviews: number;
  recentPlacements: number;
};

export type PlacementMonthSummary = {
  totalPlacements: number;
  averageTimeToFillDays: number;
  offerAcceptanceRate: number;
};

export type CandidateFilters = {
  search?: string;
  status?: string;
  experience?: string;
  skills?: string;
  location?: string;
  recruiter?: string;
  /** all | under60 | 60plus — recruiter review of weak automated matches */
  match?: string;
};

export type JobOrderFilters = {
  search?: string;
  client?: string;
  status?: string;
  location?: string;
  priority?: string;
};

export type RecruiterMessageThread = {
  id: string;
  participantType: "candidate" | "employer" | "accounting";
  participantName: string;
  participantId: string;
  subject: string;
  preview: string;
  updatedAt: string;
  unread: number;
  messages: {
    id: string;
    sender: string;
    senderRole: string;
    body: string;
    createdAt: string;
    mine: boolean;
  }[];
};

export type RecruiterProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  office: string;
  department: string;
  jobTitle: string;
  recruiterId: string;
  biography: string;
  hireDate: string;
  photoUrl: string | null;
  metrics: {
    placementsThisYear: number;
    openJobOrders: number;
    activeCandidates: number;
    averageTimeToFill: number;
    interviewToHireRate: number;
  };
};

export function applicationStatusToPipeline(
  status: ApplicationStatus,
): PipelineStatus {
  switch (status) {
    case "submitted":
      return "Applied";
    case "reviewing":
      return "Approved";
    case "interview":
      return "Interview Scheduled";
    case "offered":
      return "Offer Sent";
    case "rejected":
    case "withdrawn":
      return "Rejected";
    default:
      return "Applied";
  }
}

export function jobStatusToUi(status: JobStatus): JobOrderStatus {
  switch (status) {
    case "open":
      return "Open";
    case "filled":
      return "Filled";
    case "closed":
      return "Closed";
    default:
      return "Open";
  }
}

export function jobRequestStatusToUi(
  status: "open" | "in_progress" | "filled" | "closed",
): JobOrderStatus {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "Interviewing";
    case "filled":
      return "Filled";
    case "closed":
      return "Closed";
    default:
      return "Open";
  }
}

export function jobRequestStatusToDb(
  status: "open" | "in_progress" | "filled" | "closed",
): JobStatus {
  if (status === "filled") return "filled";
  if (status === "closed") return "closed";
  return "open";
}

export function submittalStageToPipeline(
  stage: string,
): PipelineStatus {
  switch (stage) {
    case "submitted":
      return "Applied";
    case "under_review":
      return "Client Review";
    case "interview":
      return "Interview Scheduled";
    case "offer":
      return "Offer Sent";
    case "accepted":
      return "Hired";
    case "rejected":
      return "Rejected";
    default:
      return "Applied";
  }
}

export function uiJobStatusToDb(status: JobOrderStatus): JobStatus {
  switch (status) {
    case "Open":
    case "Interviewing":
      return "open";
    case "Filled":
      return "filled";
    case "Closed":
      return "closed";
  }
}
