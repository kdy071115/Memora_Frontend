export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface TeamMember {
  userId: number;
  name: string;
  email: string;
  joinedAt: string;
}

export interface Team {
  id: number;
  courseId: number;
  courseTitle: string;
  leaderId: number;
  leaderName: string;
  name: string;
  description: string | null;
  members: TeamMember[];
  createdAt: string;
}

export interface TeamInput {
  name: string;
  description?: string;
}

export interface TeamInvitation {
  id: number;
  teamId: number;
  teamName: string;
  courseId: number;
  courseTitle: string;
  inviterId: number;
  inviterName: string;
  inviteeId: number;
  inviteeName: string;
  status: InvitationStatus;
  createdAt: string;
  respondedAt: string | null;
}
