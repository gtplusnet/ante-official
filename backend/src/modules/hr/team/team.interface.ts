export interface CreateTeamRequest {
  name: string;
  memberIds?: string[];
}

export interface UpdateTeamRequest {
  id: number;
  name: string;
}

export interface TeamDataResponse {
  id: number;
  name: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AddTeamMemberRequest {
  teamId: number;
  accountIds: string[];
}

export interface RemoveTeamMemberRequest {
  teamId: number;
  accountId: string;
}

export interface TeamMemberResponse {
  id: number;
  accountId: string;
  name: string;
  position: string;
  department: string;
  joinedAt: Date;
}

export interface TeamDetailResponse extends TeamDataResponse {
  members: TeamMemberResponse[];
}

export interface TeamScheduleAssignmentRequest {
  teamId: number;
  date: string;
  projectId: number | null;
  shiftId: number | null;
}

export interface BulkTeamScheduleAssignmentRequest {
  assignments: TeamScheduleAssignmentRequest[];
}

export interface TeamScheduleAssignmentResponse {
  id: number;
  teamId: number;
  date: string;
  projectId: number | null;
  shiftId: number | null;
  updatedAt: Date;
}
