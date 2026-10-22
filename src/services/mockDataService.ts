import type {
  Member,
  ClubEvent,
  AttendanceRecord,
  RegistrationInput,
  LoginInput,
  ApprovalStatus,
} from "@/types";

export const ACTIVE_ACADEMIC_YEAR = "2026-27";

const STORAGE_KEYS = {
  MEMBERS: "actcet_members_v2",
  EVENTS: "actcet_events_v2",
  ATTENDANCE: "actcet_attendance_v2",
  SESSION: "actcet_session_v2",
};

// In-memory demo credentials map (never storing real passwords in localStorage)
const DEMO_CREDENTIALS: Record<string, { name: string; email: string; pass: string }> = {
  "aarav.chairperson@tcetmumbai.in": {
    name: "Aarav Sharma",
    email: "aarav.chairperson@tcetmumbai.in",
    pass: "Admin@1234",
  },
  "rajesh.mentor@tcetmumbai.in": {
    name: "Dr. Rajesh Kumar",
    email: "rajesh.mentor@tcetmumbai.in",
    pass: "Admin@1234",
  },
  "shinjini.tech@tcetmumbai.in": {
    name: "Shinjini Dutta",
    email: "shinjini.tech@tcetmumbai.in",
    pass: "Member@1234",
  },
  "ananya.creative@tcetmumbai.in": {
    name: "Ananya Patel",
    email: "ananya.creative@tcetmumbai.in",
    pass: "Member@1234",
  },
  "rohan.member@tcetmumbai.in": {
    name: "Rohan Gupta",
    email: "rohan.member@tcetmumbai.in",
    pass: "Member@1234",
  },
  "vikram.pending@tcetmumbai.in": {
    name: "Vikram Singh",
    email: "vikram.pending@tcetmumbai.in",
    pass: "Pending@1234",
  },
  "neha.rejected@tcetmumbai.in": {
    name: "Neha Joshi",
    email: "neha.rejected@tcetmumbai.in",
    pass: "Rejected@1234",
  },
};

// In-memory credential registry for registered users in the session
const sessionCredentials = new Map<string, string>();

// Seed Members
const SEED_MEMBERS: Member[] = [
  {
    id: "mem-1",
    name: "Aarav Sharma",
    branch: "Comp",
    division: "B",
    year: "TE",
    academicYear: "2026-27",
    email: "aarav.chairperson@tcetmumbai.in",
    role: "Chairperson",
    approvalStatus: "approved",
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    id: "mem-2",
    name: "Dr. Rajesh Kumar",
    branch: "ECS",
    division: "A",
    year: "BE",
    academicYear: "2026-27",
    email: "rajesh.mentor@tcetmumbai.in",
    role: "Mentor",
    approvalStatus: "approved",
    createdAt: "2026-07-01T10:05:00Z",
  },
  {
    id: "mem-3",
    name: "Shinjini Dutta",
    branch: "CSE(IoT)",
    division: "A",
    year: "SE",
    academicYear: "2026-27",
    email: "shinjini.tech@tcetmumbai.in",
    role: "Technical Head",
    approvalStatus: "approved",
    createdAt: "2026-07-02T11:20:00Z",
  },
  {
    id: "mem-4",
    name: "Ananya Patel",
    branch: "AIML",
    division: "A",
    year: "SE",
    academicYear: "2026-27",
    email: "ananya.creative@tcetmumbai.in",
    role: "Creative Head",
    approvalStatus: "approved",
    createdAt: "2026-07-03T09:15:00Z",
  },
  {
    id: "mem-5",
    name: "Priya Nair",
    branch: "IT",
    division: "B",
    year: "TE",
    academicYear: "2026-27",
    email: "priya.doc@tcetmumbai.in",
    role: "Documentation Head",
    approvalStatus: "approved",
    createdAt: "2026-07-03T14:40:00Z",
  },
  {
    id: "mem-6",
    name: "Krrish Joshi",
    branch: "Comp",
    division: "C",
    year: "BE",
    academicYear: "2026-27",
    email: "krrish.events@tcetmumbai.in",
    role: "Event Management Head",
    approvalStatus: "approved",
    createdAt: "2026-07-04T12:00:00Z",
  },
  {
    id: "mem-7",
    name: "Rohan Gupta",
    branch: "EXTC",
    division: "C",
    year: "BE",
    academicYear: "2026-27",
    email: "rohan.member@tcetmumbai.in",
    role: "Member",
    approvalStatus: "approved",
    createdAt: "2026-07-05T16:30:00Z",
  },
  {
    id: "mem-8",
    name: "Kimaya Jain",
    branch: "IOT",
    division: "A",
    year: "SE",
    academicYear: "2026-27",
    email: "kimaya.wc@tcetmumbai.in",
    role: "Working Committee - Creative",
    approvalStatus: "approved",
    createdAt: "2026-07-06T10:00:00Z",
  },
  {
    id: "mem-9",
    name: "Abhay Singh",
    branch: "Mech",
    division: "B",
    year: "TE",
    academicYear: "2026-27",
    email: "abhay.wc@tcetmumbai.in",
    role: "Working Committee - Event",
    approvalStatus: "approved",
    createdAt: "2026-07-06T15:20:00Z",
  },
  {
    id: "mem-10",
    name: "Mansi Deshmukh",
    branch: "CSE(CS)",
    division: "A",
    year: "BE",
    academicYear: "2025-26",
    email: "mansi.former@tcetmumbai.in",
    role: "Vice Chairperson",
    approvalStatus: "approved",
    createdAt: "2025-08-01T10:00:00Z",
  },
  {
    id: "mem-11",
    name: "Aryan Verma",
    branch: "Civil",
    division: "B",
    year: "TE",
    academicYear: "2025-26",
    email: "aryan.member@tcetmumbai.in",
    role: "Member",
    approvalStatus: "approved",
    createdAt: "2025-08-05T12:00:00Z",
  },
  {
    id: "mem-12",
    name: "Vikram Singh",
    branch: "Mech",
    division: "A",
    year: "SE",
    academicYear: "2026-27",
    email: "vikram.pending@tcetmumbai.in",
    role: "Member",
    approvalStatus: "pending",
    createdAt: "2026-08-10T09:00:00Z",
  },
  {
    id: "mem-13",
    name: "Aditya Verma",
    branch: "AIDS",
    division: "B",
    year: "SE",
    academicYear: "2026-27",
    email: "aditya.pending@tcetmumbai.in",
    role: "Working Committee - Technical",
    approvalStatus: "pending",
    createdAt: "2026-08-11T14:15:00Z",
  },
  {
    id: "mem-14",
    name: "Neha Joshi",
    branch: "Civil",
    division: "D",
    year: "BE",
    academicYear: "2026-27",
    email: "neha.rejected@tcetmumbai.in",
    role: "Guest",
    approvalStatus: "rejected",
    createdAt: "2026-08-12T11:00:00Z",
    rejectionReason: "Incomplete academic verification documents",
  },
];

// Seed Events
const SEED_EVENTS: ClubEvent[] = [
  {
    id: "evt-1",
    name: "Telescope Observation",
    academicYear: "2026-27",
    date: "2026-08-15",
    aicteHours: 4,
    description: "Hands-on sky tracking and lunar surface observation with 8-inch Dobsonian telescope.",
  },
  {
    id: "evt-2",
    name: "Astrophotography Workshop",
    academicYear: "2026-27",
    date: "2026-09-22",
    aicteHours: 2,
    description: "Deep-sky imaging, long exposure techniques, and celestial post-processing masterclass.",
  },
  {
    id: "evt-3",
    name: "Astronomy Quiz",
    academicYear: "2026-27",
    date: "2026-10-10",
    aicteHours: 3,
    description: "Inter-collegiate astrophysics and cosmic exploration challenge.",
  },
  {
    id: "evt-4",
    name: "Solar Eclipse Watch",
    academicYear: "2025-26",
    date: "2025-10-25",
    aicteHours: 4,
    description: "Safe solar projection and sunspot count observation.",
  },
  {
    id: "evt-5",
    name: "Rocketry Basics",
    academicYear: "2025-26",
    date: "2025-11-14",
    aicteHours: 3,
    description: "Propulsion mechanics and water rocket launch workshop.",
  },
];

// Seed Attendance Records
const SEED_ATTENDANCE: AttendanceRecord[] = [
  // Shinjini Dutta (mem-3): Telescope (4h) + Astrophotography (2h) = 6h -> 1.5 AICTE
  { memberId: "mem-3", eventId: "evt-1", attended: true },
  { memberId: "mem-3", eventId: "evt-2", attended: true },
  { memberId: "mem-3", eventId: "evt-3", attended: false },

  // Aarav Sharma (mem-1): Telescope (4h) + Astrophotography (2h) + Quiz (3h) = 9h -> 2.25 AICTE
  { memberId: "mem-1", eventId: "evt-1", attended: true },
  { memberId: "mem-1", eventId: "evt-2", attended: true },
  { memberId: "mem-1", eventId: "evt-3", attended: true },

  // Dr. Rajesh Kumar (mem-2): Telescope (4h) + Astrophotography (2h) = 6h -> 1.5 AICTE
  { memberId: "mem-2", eventId: "evt-1", attended: true },
  { memberId: "mem-2", eventId: "evt-2", attended: true },

  // Ananya Patel (mem-4): Telescope (4h) = 4h -> 1.0 AICTE
  { memberId: "mem-4", eventId: "evt-1", attended: true },
  { memberId: "mem-4", eventId: "evt-2", attended: false },
  { memberId: "mem-4", eventId: "evt-3", attended: false },

  // Priya Nair (mem-5): Astrophotography (2h) + Quiz (3h) = 5h -> 1.25 AICTE
  { memberId: "mem-5", eventId: "evt-2", attended: true },
  { memberId: "mem-5", eventId: "evt-3", attended: true },

  // Krrish Joshi (mem-6): Telescope (4h) + Quiz (3h) = 7h -> 1.75 AICTE
  { memberId: "mem-6", eventId: "evt-1", attended: true },
  { memberId: "mem-6", eventId: "evt-3", attended: true },

  // Rohan Gupta (mem-7): Astrophotography (2h) = 2h -> 0.5 AICTE
  { memberId: "mem-7", eventId: "evt-2", attended: true },

  // Kimaya Jain (mem-8): Telescope (4h) + Quiz (3h) = 7h -> 1.75 AICTE
  { memberId: "mem-8", eventId: "evt-1", attended: true },
  { memberId: "mem-8", eventId: "evt-3", attended: true },

  // Abhay Singh (mem-9): Astrophotography (2h) + Quiz (3h) = 5h -> 1.25 AICTE
  { memberId: "mem-9", eventId: "evt-2", attended: true },
  { memberId: "mem-9", eventId: "evt-3", attended: true },

  // Mansi Deshmukh (mem-10, 2025-26): Solar (4h) + Rocketry (3h) = 7h -> 1.75 AICTE
  { memberId: "mem-10", eventId: "evt-4", attended: true },
  { memberId: "mem-10", eventId: "evt-5", attended: true },

  // Aryan Verma (mem-11, 2025-26): Solar (4h) = 4h -> 1.0 AICTE
  { memberId: "mem-11", eventId: "evt-4", attended: true },
  { memberId: "mem-11", eventId: "evt-5", attended: false },
];

class MockDataService {
  private members: Member[] = [];
  private events: ClubEvent[] = [];
  private attendance: AttendanceRecord[] = [];
  private currentUserId: string | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      const storedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
      const storedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      const storedSession = localStorage.getItem(STORAGE_KEYS.SESSION);

      this.members = storedMembers ? JSON.parse(storedMembers) : [...SEED_MEMBERS];
      this.events = storedEvents ? JSON.parse(storedEvents) : [...SEED_EVENTS];
      this.attendance = storedAttendance ? JSON.parse(storedAttendance) : [...SEED_ATTENDANCE];
      this.currentUserId = storedSession ? JSON.parse(storedSession) : null;
    } catch {
      this.members = [...SEED_MEMBERS];
      this.events = [...SEED_EVENTS];
      this.attendance = [...SEED_ATTENDANCE];
      this.currentUserId = null;
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(this.members));
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this.events));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(this.attendance));
      if (this.currentUserId) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(this.currentUserId));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch (e) {
      console.warn("Could not persist mock state to localStorage", e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetToDefault() {
    this.members = [...SEED_MEMBERS];
    this.events = [...SEED_EVENTS];
    this.attendance = [...SEED_ATTENDANCE];
    this.currentUserId = null;
    this.persist();
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  public registerUser(input: RegistrationInput): { success: boolean; member?: Member; error?: string } {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanName = input.name.trim();

    // Validation: Missing fields
    if (!cleanName || !cleanEmail || !input.branch || !input.division || !input.year || !input.role) {
      return { success: false, error: "Please fill in all required fields." };
    }

    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // Validation: Duplicate email
    const exists = this.members.some((m) => m.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, error: "An account with this email address already exists." };
    }

    // Validation: Password length
    if (!input.password || input.password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    // Store credential in memory (never written to localStorage)
    sessionCredentials.set(cleanEmail, input.password);

    const newMember: Member = {
      id: "mem-" + Date.now(),
      name: cleanName,
      branch: input.branch,
      division: input.division,
      year: input.year,
      academicYear: input.academicYear || ACTIVE_ACADEMIC_YEAR,
      email: cleanEmail,
      role: input.role,
      approvalStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    this.members.push(newMember);
    this.persist();

    return { success: true, member: newMember };
  }

  public loginUser(input: LoginInput): {
    success: boolean;
    member?: Member;
    status?: ApprovalStatus;
    message?: string;
  } {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanName = input.name.trim().toLowerCase();
    const cleanPass = input.password || "";

    const member = this.members.find((m) => m.email.toLowerCase() === cleanEmail);

    if (!member) {
      return {
        success: false,
        message: "No account found matching this email address. Please verify or register.",
      };
    }

    // Check name match (case-insensitive)
    if (member.name.toLowerCase() !== cleanName) {
      return {
        success: false,
        message: "The name entered does not match our records for this email address.",
      };
    }

    // Verify password against demo credential registry or session registry
    const demoCred = DEMO_CREDENTIALS[cleanEmail];
    const registeredPass = sessionCredentials.get(cleanEmail);

    const expectedPass = demoCred ? demoCred.pass : registeredPass;

    if (expectedPass && expectedPass !== cleanPass) {
      return {
        success: false,
        message: "Incorrect password. Please try again or check demo account credentials.",
      };
    }

    // Check Approval Status
    if (member.approvalStatus === "pending") {
      return {
        success: false,
        member,
        status: "pending",
        message: "Your account is awaiting administrator approval.",
      };
    }

    if (member.approvalStatus === "rejected") {
      return {
        success: false,
        member,
        status: "rejected",
        message: "Your account registration has not been approved. Please contact the club administration.",
      };
    }

    // Approved: Set active session
    this.currentUserId = member.id;
    this.persist();

    return { success: true, member };
  }

  public logoutUser() {
    this.currentUserId = null;
    this.persist();
  }

  public getCurrentUser(): Member | null {
    if (!this.currentUserId) return null;
    return this.members.find((m) => m.id === this.currentUserId) || null;
  }

  public setCurrentUserById(memberId: string) {
    const member = this.members.find((m) => m.id === memberId);
    if (member && member.approvalStatus === "approved") {
      this.currentUserId = member.id;
      this.persist();
      return member;
    }
    return null;
  }

  // ==========================================
  // MEMBERS & APPROVAL MANAGEMENT
  // ==========================================

  public getAllMembers(): Member[] {
    return [...this.members];
  }

  public getApprovedMembers(): Member[] {
    return this.members.filter((m) => m.approvalStatus === "approved");
  }

  public getPendingUsers(): Member[] {
    return this.members.filter((m) => m.approvalStatus === "pending");
  }

  public approveUser(memberId: string): boolean {
    const member = this.members.find((m) => m.id === memberId);
    if (!member) return false;

    member.approvalStatus = "approved";
    this.persist();
    return true;
  }

  public rejectUser(memberId: string, reason?: string): boolean {
    const member = this.members.find((m) => m.id === memberId);
    if (!member) return false;

    member.approvalStatus = "rejected";
    if (reason) {
      member.rejectionReason = reason;
    }
    this.persist();
    return true;
  }

  // ==========================================
  // EVENTS MANAGEMENT
  // ==========================================

  public getEvents(): ClubEvent[] {
    return [...this.events];
  }

  public getEventsByAcademicYear(year: string): ClubEvent[] {
    return this.events.filter((e) => e.academicYear === year);
  }

  public getAcademicYears(): string[] {
    // Unique academic years discovered dynamically from members and events
    const years = new Set<string>();
    this.events.forEach((e) => years.add(e.academicYear));
    this.members.forEach((m) => years.add(m.academicYear));
    // Sort descending (e.g. 2026-27, 2025-26)
    return Array.from(years).sort().reverse();
  }

  public addEvent(eventData: Omit<ClubEvent, "id">): ClubEvent {
    const newEvent: ClubEvent = {
      id: "evt-" + Date.now(),
      name: eventData.name.trim(),
      academicYear: eventData.academicYear.trim(),
      date: eventData.date,
      aicteHours: Number(eventData.aicteHours),
      description: eventData.description?.trim(),
    };

    this.events.push(newEvent);

    // Default attendance for all existing members is false
    this.members.forEach((member) => {
      this.attendance.push({
        memberId: member.id,
        eventId: newEvent.id,
        attended: false,
      });
    });

    this.persist();
    return newEvent;
  }

  // ==========================================
  // ATTENDANCE MANAGEMENT
  // ==========================================

  public getAttendance(academicYear?: string): AttendanceRecord[] {
    if (!academicYear) return [...this.attendance];

    // Filter events of this academic year
    const relevantEventIds = new Set(
      this.events.filter((e) => e.academicYear === academicYear).map((e) => e.id)
    );

    return this.attendance.filter((rec) => relevantEventIds.has(rec.eventId));
  }

  public isAttended(memberId: string, eventId: string): boolean {
    const rec = this.attendance.find((a) => a.memberId === memberId && a.eventId === eventId);
    return rec ? rec.attended : false;
  }

  public updateAttendance(memberId: string, eventId: string, attended: boolean): boolean {
    const existingIndex = this.attendance.findIndex(
      (a) => a.memberId === memberId && a.eventId === eventId
    );

    if (existingIndex >= 0) {
      this.attendance[existingIndex].attended = attended;
    } else {
      this.attendance.push({ memberId, eventId, attended });
    }

    this.persist();
    return true;
  }

  public getDemoAccounts() {
    return DEMO_CREDENTIALS;
  }
}

// Singleton export
export const mockDataService = new MockDataService();
