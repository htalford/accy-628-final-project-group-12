import { listClientMessageThreads } from "@/lib/client-portal/portal-data";
import { MessagesClient } from "./messages-client";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const params = await searchParams;
  const folder = params.folder === "deleted" ? "deleted" : "inbox";
  const [inbox, deleted] = await Promise.all([
    listClientMessageThreads("inbox"),
    listClientMessageThreads("deleted"),
  ]);
  return (
    <MessagesClient
      initialInbox={inbox}
      initialDeleted={deleted}
      folder={folder}
    />
  );
}
