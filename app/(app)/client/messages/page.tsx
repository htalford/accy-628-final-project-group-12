import { listClientMessageThreads } from "@/lib/client-portal/portal-data";
import { MessagesClient } from "./messages-client";

export default async function MessagesPage() {
  const threads = await listClientMessageThreads();
  return <MessagesClient initial={threads} />;
}
