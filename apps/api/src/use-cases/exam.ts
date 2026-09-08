import { PostgresRepository } from '../repository';
import {
  CreateExamInput,
  UpdateExamSchema,
  ExamType,
  validateExamCapacity,
  isDuplicateExam,
  calculateTotalNet,
  getCurrentDayInIstanbul,
} from '../domain';
import { generateBodyHash } from '../domain';

export class ExamUseCase {
  constructor(private repo: PostgresRepository) {}

  /**
   * Create exam with idempotency and validation
   */
  async createExam(input: CreateExamInput, userId: string): Promise<{ id: string }> {
    // Validate input
    if (!validateExamCapacity(input.totalQuestions, input.subjects)) {
      throw new Error('Invalid exam capacity: answers do not match total questions');
    }

    // Check for existing exam with same clientId (idempotency)
    const bodyHash = generateBodyHash(input);
    const existing = await this.repo.insert('exams', {
      student_id: input.studentId,
      title: input.title,
      type: input.type,
      day: input.day,
      total_questions: input.totalQuestions,
      divisor: input.divisor,
      created_by: userId,
      client_id: input.clientId,
      body_hash: bodyHash,
    });

    if (!existing || !('id' in existing)) {
      throw new Error('Failed to create exam');
    }

    const examId = existing.id as string;

    // Insert subjects
    for (const subject of input.subjects) {
      await this.repo.insert('exam_subjects', {
        exam_id: examId,
        name: subject.name,
        correct: subject.correct,
        wrong: subject.wrong,
        blank: subject.blank,
        topics: subject.topics || [],
      });
    }

    return { id: examId };
  }

  /**
   * Get student exams with pagination
   */
  async getStudentExams(
    studentId: string,
    limit: number = 500,
    offset: number = 0
  ): Promise<{
    exams: unknown[];
    total: number;
  }> {
    const exams = await this.repo.query(
      `SELECT e.*, json_agg(json_build_object(
        'id', es.id,
        'name', es.name,
        'correct', es.correct,
        'wrong', es.wrong,
        'blank', es.blank,
        'net', es.net,
        'topics', es.topics
      )) as subjects
      FROM exams e
      LEFT JOIN exam_subjects es ON e.id = es.exam_id
      WHERE e.student_id = $1
      GROUP BY e.id
      ORDER BY e.day DESC
      LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );

    const countResult = await this.repo.query(
      'SELECT COUNT(*) as count FROM exams WHERE student_id = $1',
      [studentId]
    );

    return {
      exams,
      total: (countResult[0] as { count: number }).count || 0,
    };
  }

  /**
   * Update exam with versioning
   */
  async updateExam(
    examId: string,
    input: unknown,
    userId: string
  ): Promise<{ id: string }> {
    const parsed = UpdateExamSchema.parse(input);

    // Get current exam
    const exams = await this.repo.query(
      'SELECT * FROM exams WHERE id = $1',
      [examId]
    );

    if (!exams || exams.length === 0) {
      throw new Error('Exam not found');
    }

    const exam = exams[0] as { id: string };

    // Create history record
    const currentSubjects = await this.repo.query(
      'SELECT * FROM exam_subjects WHERE exam_id = $1',
      [examId]
    );

    await this.repo.insert('exam_history', {
      exam_id: examId,
      version: parsed.version,
      before_data: JSON.stringify(currentSubjects),
      after_data: JSON.stringify(parsed.subjects),
      changed_by: userId,
    });

    // Update subjects
    for (const subject of parsed.subjects) {
      await this.repo.update(
        'exam_subjects',
        subject,
        { exam_id: examId, name: subject.name }
      );
    }

    return { id: examId };
  }

  /**
   * Calculate student progress
   */
  async calculateProgress(studentId: string): Promise<{
    currentScore: number;
    previousScore: number;
    progress: number;
    bySubject: Record<string, number>;
  }> {
    const exams = await this.repo.query(
      `SELECT e.id, e.day, e.type, json_agg(json_build_object(
        'name', es.name,
        'net', es.net
      )) as subjects
      FROM exams e
      LEFT JOIN exam_subjects es ON e.id = es.exam_id
      WHERE e.student_id = $1
      GROUP BY e.id, e.day, e.type
      ORDER BY e.day DESC
      LIMIT 2`,
      [studentId]
    );

    if (exams.length === 0) {
      return {
        currentScore: 0,
        previousScore: 0,
        progress: 0,
        bySubject: {},
      };
    }

    const current = exams[0] as { subjects: Array<{ name: string; net: number }> };
    const currentTotal = current.subjects?.reduce((sum, s) => sum + (s.net || 0), 0) || 0;

    if (exams.length === 1) {
      return {
        currentScore: currentTotal,
        previousScore: 0,
        progress: currentTotal,
        bySubject: {},
      };
    }

    const previous = exams[1] as { subjects: Array<{ name: string; net: number }> };
    const previousTotal = previous.subjects?.reduce((sum, s) => sum + (s.net || 0), 0) || 0;

    const bySubject: Record<string, number> = {};
    current.subjects?.forEach((curr, idx) => {
      const prev = previous.subjects?.[idx];
      bySubject[curr.name] = (curr.net || 0) - (prev?.net || 0);
    });

    return {
      currentScore: currentTotal,
      previousScore: previousTotal,
      progress: currentTotal - previousTotal,
      bySubject,
    };
  }
}
