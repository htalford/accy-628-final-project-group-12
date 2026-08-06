import { redirect } from "next/navigation";

/** Interested candidates removed from the Employer Portal. */
export default function InterestedCandidatesPage() {
  redirect("/client/dashboard");
}
