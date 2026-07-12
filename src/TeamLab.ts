// ─────────────────────────────────────────────────────────────────────────────
// TeamLab data model — shared types + option lists.
// TeamLab belongs to each STARTUP (analysis id), not the founder.
// Collections: `teams`, `positions`, `applications`.
// ─────────────────────────────────────────────────────────────────────────────

export const EMPLOYMENT_TYPES = ['Co-Founder', 'Full-Time', 'Part-Time', 'Freelancer', 'Advisor'] as const;
export const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'] as const;
export const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior'] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type WorkType = (typeof WORK_TYPES)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type PositionStatus = 'open' | 'closed';
export type ApplicationStatus = 'new' | 'accepted' | 'declined';

// A member the founder added to a startup's roster (collection: `teams`).
export interface TeamMemberRecord {
  id?: string;
  startupId: string;   // analysis id this team belongs to
  founderId: string;   // uid of the startup's founder (owner)
  fullName: string;
  position: string;
  linkedin?: string;
  email?: string;
  createdAt?: any;
}

// A published open role for a startup (collection: `positions`).
export interface PositionRecord {
  id?: string;
  startupId: string;
  founderId: string;
  startupName?: string;      // denormalized for browse listings
  industry?: string;         // denormalized for browse listings
  stage?: string;            // denormalized for browse listings
  title: string;
  employmentType: EmploymentType;
  workType: WorkType;
  experienceLevel: ExperienceLevel;
  requiredSkills: string[];
  description: string;
  status: PositionStatus;
  applicantCount: number;
  createdAt?: any;
}

// An application a team member submits (collection: `applications`).
export interface ApplicationRecord {
  id?: string;
  positionId: string;
  startupId: string;
  founderId: string;         // denormalized so rules + founder queries are simple
  applicantId: string;       // uid of the applying team member
  applicantName: string;
  positionTitle?: string;    // denormalized for list views
  startupName?: string;      // denormalized for list views
  resumeUrl: string;         // Firebase Storage URL (PDF)
  portfolioUrl?: string;
  github?: string;
  linkedin?: string;
  coverLetter?: string;
  skills?: string;
  experience?: string;
  status: ApplicationStatus;
  createdAt?: any;
  decidedAt?: any;
}

// Onboarding answer after analysis completes.
export type TeamLabIntent = 'have_team' | 'looking' | 'later';