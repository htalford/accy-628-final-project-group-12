export type CandidateNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  time: string;
  tone: "warning" | "info" | "success";
};
