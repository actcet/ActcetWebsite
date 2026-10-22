export type Branch =
  | "Comp"
  | "AIML"
  | "AIDS"
  | "IOT"
  | "Mech"
  | "ECS"
  | "Civil"
  | "CSE(CS)"
  | "CSE(IoT)"
  | "EXTC"
  | "IT";

export type Division = "A" | "B" | "C" | "D";

export type StudyYear = "SE" | "TE" | "BE";

export type UserRole =
  | "Mentor"
  | "Chairperson"
  | "Vice Chairperson"
  | "Creative Head"
  | "Documentation Head"
  | "Event Management Head"
  | "Technical Head"
  | "Working Committee - Technical"
  | "Working Committee - Creative"
  | "Working Committee - Event"
  | "Working Committee - Documentation"
  | "Member"
  | "Guest";

export type ApprovalStatus = "pending" | "approved" | "rejected";
export type AccountType = "member" | "club_admin";

export interface Member {
  id: string;
  name: string;
  accountType: AccountType;
  branch: Branch | null;
  division: Division | null;
  year: StudyYear | null;
  academicYear: string | null;
  email: string;
  role: UserRole;
  requestedRole: UserRole;
  approvalStatus: ApprovalStatus;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectionReason?: string;
}

export interface ClubEvent {
  id: string;
  name: string;
  academicYear: string;
  date: string;
  aicteHours: number;
  description?: string;
}

export interface AttendanceRecord {
  memberId: string;
  eventId: string;
  attended: boolean;
}

export interface AuthState {
  currentUser: Member | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RegistrationInput {
  name: string;
  branch: Branch;
  division: Division;
  year: StudyYear;
  email: string;
  role: UserRole;
  password?: string;
  academicYear?: string;
}

export interface LoginInput {
  name: string;
  email: string;
  password?: string;
}

export interface AICTESummary {
  totalHours: number;
  points: number;
  formattedPoints: string;
}
