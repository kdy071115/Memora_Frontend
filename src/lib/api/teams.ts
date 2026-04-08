import { memoraApi } from "../axios";
import type { ApiResponse } from "../../types/api";
import type { Team, TeamInput, TeamInvitation } from "../../types/team";

// ── Teams ──────────────────────────────────────────

export const createTeam = async (courseId: number, input: TeamInput): Promise<Team> => {
  const { data } = await memoraApi.post<ApiResponse<Team>>(
    `/courses/${courseId}/teams`,
    input
  );
  return data.data;
};

export const getCourseTeams = async (courseId: number): Promise<Team[]> => {
  const { data } = await memoraApi.get<ApiResponse<Team[]>>(`/courses/${courseId}/teams`);
  return data.data ?? [];
};

export const getTeam = async (teamId: number): Promise<Team> => {
  const { data } = await memoraApi.get<ApiResponse<Team>>(`/teams/${teamId}`);
  return data.data;
};

export const updateTeam = async (teamId: number, input: TeamInput): Promise<Team> => {
  const { data } = await memoraApi.put<ApiResponse<Team>>(`/teams/${teamId}`, input);
  return data.data;
};

export const disbandTeam = async (teamId: number): Promise<void> => {
  await memoraApi.delete(`/teams/${teamId}`);
};

export const leaveTeam = async (teamId: number): Promise<void> => {
  await memoraApi.delete(`/teams/${teamId}/members/me`);
};

// ── Invitations ──────────────────────────────────────────

export const inviteToTeam = async (
  teamId: number,
  inviteeId: number
): Promise<TeamInvitation> => {
  const { data } = await memoraApi.post<ApiResponse<TeamInvitation>>(
    `/teams/${teamId}/invitations`,
    { inviteeId }
  );
  return data.data;
};

export const getMyPendingInvitations = async (): Promise<TeamInvitation[]> => {
  const { data } = await memoraApi.get<ApiResponse<TeamInvitation[]>>(
    `/me/team-invitations`
  );
  return data.data ?? [];
};

export const acceptInvitation = async (invitationId: number): Promise<TeamInvitation> => {
  const { data } = await memoraApi.post<ApiResponse<TeamInvitation>>(
    `/team-invitations/${invitationId}/accept`
  );
  return data.data;
};

export const rejectInvitation = async (invitationId: number): Promise<TeamInvitation> => {
  const { data } = await memoraApi.post<ApiResponse<TeamInvitation>>(
    `/team-invitations/${invitationId}/reject`
  );
  return data.data;
};
