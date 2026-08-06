import { redirect } from "next/navigation";

/** Employer candidate matching lives on the Recruiter Portal. */
export default function CandidatesPage() {
  redirect("/client/dashboard");
}
