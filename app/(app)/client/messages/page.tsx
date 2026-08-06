import { listClientMessageThreads } from "@/lib/client-portal/portal-data";
import { MessagesClient } from "./messages-client";

export default async function MessagesPage() {
  const [inbox, deleted] = await Promise.all([
    listClientMessageThreads("inbox"),
    listClientMessageThreads("deleted"),
  ]);
  return <MessagesClient initialInbox={inbox} initialDeleted={deleted} />;
}
