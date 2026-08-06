import { redirect } from "next/navigation";

/** Matched applications live on the recruiter dashboard. */
export default function CandidatesPage() {
  redirect("/client/candidates/interested");
}
