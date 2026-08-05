export type StaffMessageLane = "recruiter" | "accounting";

export type StaffChatMessage = {
  id: string;
  sender: string;
  senderRole: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type StaffCandidateThread = {
  id: string;
  employeeId: string;
  participantName: string;
  subject: string;
  preview: string;
  updatedAt: string;
  unread: number;
  messages: StaffChatMessage[];
};
