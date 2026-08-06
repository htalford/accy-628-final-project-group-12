"use server";

import {
  getPublicOpenJobs,
  type PublicJobListing,
} from "@/lib/marketing/public-jobs";

export async function searchPublicJobTitles(input: {
  q?: string;
  location?: string;
  remote?: boolean;
}): Promise<PublicJobListing[]> {
  return getPublicOpenJobs({
    q: input.q,
    location: input.location,
    remote: input.remote,
  });
}
