import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  COUNSELOR = 'counselor',
  STUDENT = 'student',
}

export enum ExamType {
  TYT = 'TYT',
  AYT = 'AYT',
}

export enum TaskStatus {
  ASSIGNED = 'assigned',
  SUBMITTED = 'submitted',
  REVISION_REQUESTED = 'revision_requested',
  ACCEPTED = 'accepted',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  EXCUSED = 'excused',
  PENDING = 'pending',
}

export enum SessionType {
  STUDY = 'study',
  TUTORING = 'tutoring',
  EXAM_PREP = 'exam_prep',
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Auth schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Tenant schemas
export const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').optional(),
  address: z.string().optional(),
});

// Student schemas
export const CreateStudentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  studentNumber: z.string().optional(),
  parentEmail: z.string().email('Invalid parent email').optional(),
  parentPhone: z.string().optional(),
});

// Exam schemas
export const ExamSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  correct: z.number().int().min(0, 'Correct answers cannot be negative'),
  wrong: z.number().int().min(0, 'Wrong answers cannot be negative'),
  blank: z.number().int().min(0, 'Blank answers cannot be negative'),
  topics: z.array(z.string()).optional(),
});

export const CreateExamSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  studentId: z.string().uuid('Invalid student ID'),
  title: z.string().min(1, 'Exam title is required'),
  type: z.enum([ExamType.TYT, ExamType.AYT]),
  day: z.string().datetime('Invalid date format'),
  totalQuestions: z.number().int().min(1, 'Total questions must be at least 1'),
  divisor: z.number().positive('Divisor must be positive'),
  subjects: z.array(ExamSubjectSchema).length(4, 'Exam must have exactly 4 subjects'),
}).refine(
  (data) => {
    const totalAnswered = data.subjects.reduce((sum, s) => sum + s.correct + s.wrong + s.blank, 0);
    return totalAnswered === data.totalQuestions * 4;
  },
  {
    message: 'Total answers across all subjects must match total questions',
    path: ['subjects'],
  }
);

export const UpdateExamSchema = z.object({
  version: z.number().int().min(1, 'Version must be at least 1'),
  subjects: z.array(ExamSubjectSchema).length(4, 'Exam must have exactly 4 subjects'),
});

// Task schemas
export const CreateTaskSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  studentId: z.string().uuid('Invalid student ID'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  dueDate: z.string().datetime('Invalid date format'),
});

export const SubmitTaskSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  version: z.number().int().min(1, 'Version must be at least 1'),
  content: z.string().min(1, 'Content is required'),
});

export const ReviewTaskSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  status: z.enum([TaskStatus.ACCEPTED, TaskStatus.REVISION_REQUESTED]),
  feedback: z.string().optional(),
});

// Study session schemas
export const CreateSessionSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  studentId: z.string().uuid('Invalid student ID'),
  title: z.string().min(1, 'Session title is required'),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  type: z.enum([SessionType.STUDY, SessionType.TUTORING, SessionType.EXAM_PREP]),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const RecordAttendanceSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  studentId: z.string().uuid('Invalid student ID'),
  status: z.enum([AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.EXCUSED]),
});

// Invitation schemas
export const CreateInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum([UserRole.ADMIN, UserRole.TEACHER, UserRole.COUNSELOR, UserRole.STUDENT]),
});

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
});

// ============================================
// CALCULATED FIELDS
// ============================================

/**
 * Calculate net score for an exam subject
 * Formula: (correct - wrong/divisor) * 10
 */
export function calculateNet(
  correct: number,
  wrong: number,
  divisor: number
): number {
  return (correct - wrong / divisor) * 10;
}

/**
 * Calculate total net for exam
 */
export function calculateTotalNet(
  subjects: Array<{ correct: number; wrong: number; divisor: number }>
): number {
  return subjects.reduce((total, subject) => {
    return total + calculateNet(subject.correct, subject.wrong, subject.divisor);
  }, 0);
}

/**
 * Validate exam capacity (answers must not exceed questions)
 */
export function validateExamCapacity(
  totalQuestions: number,
  subjects: Array<{ correct: number; wrong: number; blank: number }>
): boolean {
  const totalAnswered = subjects.reduce((sum, s) => sum + s.correct + s.wrong + s.blank, 0);
  return totalAnswered === totalQuestions * subjects.length;
}

/**
 * Check for duplicate exam (same day, type, divisor)
 */
export function isDuplicateExam(
  existingExams: Array<{
    day: string;
    type: string;
    divisor: number;
  }>,
  newExam: {
    day: string;
    type: string;
    divisor: number;
  }
): boolean {
  return existingExams.some(
    (exam) =>
      exam.day === newExam.day &&
      exam.type === newExam.type &&
      exam.divisor === newExam.divisor
  );
}

/**
 * Calculate progress between two exams
 */
export function calculateProgress(
  oldExam: { subjects: Array<{ net: number }> },
  newExam: { subjects: Array<{ net: number }> }
): { overall: number; bySubject: number[] } {
  const oldTotal = oldExam.subjects.reduce((sum, s) => sum + s.net, 0);
  const newTotal = newExam.subjects.reduce((sum, s) => sum + s.net, 0);

  const bySubject = newExam.subjects.map((newSubject, idx) => {
    const oldSubject = oldExam.subjects[idx];
    return newSubject.net - (oldSubject?.net || 0);
  });

  return {
    overall: newTotal - oldTotal,
    bySubject,
  };
}

// ============================================
// TIME UTILITIES
// ============================================

/**
 * Get current day in Europe/Istanbul timezone
 */
export function getCurrentDayInIstanbul(): string {
  const istanbul = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
  }).format(new Date());
  return istanbul;
}

/**
 * Convert to UTC ISO string
 */
export function toUTCISO(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ISO string to Date
 */
export function parseISOToDate(isoString: string): Date {
  return new Date(isoString);
}

// ============================================
// IDEMPOTENCY
// ============================================

import crypto from 'crypto';

/**
 * Generate hash for idempotency deduplication
 */
export function generateBodyHash(body: Record<string, unknown>): string {
  const json = JSON.stringify(body);
  return crypto.createHash('sha256').update(json).digest('hex');
}

/**
 * Check idempotency and return cached result if exists
 */
export interface IdempotencyResult {
  isCached: boolean;
  result?: unknown;
  hash: string;
}

export function validateIdempotencyKey(clientId: string): boolean {
  try {
    z.string().uuid().parse(clientId);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// TYPES
// ============================================

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type CreateExamInput = z.infer<typeof CreateExamSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;
