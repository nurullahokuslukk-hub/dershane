import { PostgresRepository } from '../repository';
import { CreateSessionInput, AttendanceStatus, generateBodyHash } from '../domain';

export class SessionUseCase {
  constructor(private repo: PostgresRepository) {}

  /**
   * Create study session
   */
  async createSession(
    input: CreateSessionInput,
    userId: string
  ): Promise<{ id: string }> {
    const bodyHash = generateBodyHash(input);

    const session = await this.repo.insert('study_sessions', {
      student_id: input.studentId,
      title: input.title,
      start_time: input.startTime,
      end_time: input.endTime,
      type: input.type,
      status: 'scheduled',
      created_by: userId,
      client_id: input.clientId,
      body_hash: bodyHash,
    });

    if (!session || !('id' in session)) {
      throw new Error('Failed to create session');
    }

    return { id: session.id as string };
  }

  /**
   * Check for session conflicts
   */
  async checkConflicts(
    studentId: string,
    startTime: string,
    endTime: string
  ): Promise<{ hasConflict: boolean; conflicts: unknown[] }> {
    const conflicts = await this.repo.query(
      `SELECT * FROM study_sessions
       WHERE student_id = $1
       AND status != 'cancelled'
       AND NOT (
         end_time <= $2 OR start_time >= $3
       )
       ORDER BY start_time ASC`,
      [studentId, startTime, endTime]
    );

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * Record attendance
   */
  async recordAttendance(
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    userId: string
  ): Promise<{ success: boolean }> {
    if (!Object.values(AttendanceStatus).includes(status)) {
      throw new Error('Invalid attendance status');
    }

    // Check if already recorded
    const existing = await this.repo.query(
      'SELECT * FROM attendance WHERE session_id = $1 AND student_id = $2',
      [sessionId, studentId]
    );

    if (existing && existing.length > 0) {
      // Update existing
      await this.repo.update(
        'attendance',
        {
          status,
          recorded_by: userId,
          recorded_at: new Date().toISOString(),
        },
        { session_id: sessionId, student_id: studentId }
      );
    } else {
      // Insert new
      await this.repo.insert('attendance', {
        session_id: sessionId,
        student_id: studentId,
        status,
        recorded_by: userId,
        recorded_at: new Date().toISOString(),
      });
    }

    return { success: true };
  }

  /**
   * Get session attendance
   */
  async getSessionAttendance(
    sessionId: string
  ): Promise<unknown[]> {
    return this.repo.query(
      `SELECT a.*, u.full_name, u.email
       FROM attendance a
       LEFT JOIN users u ON a.student_id = u.id
       WHERE a.session_id = $1
       ORDER BY a.created_at ASC`,
      [sessionId]
    );
  }

  /**
   * Get student sessions
   */
  async getStudentSessions(
    studentId: string,
    limit: number = 500,
    offset: number = 0
  ): Promise<{
    sessions: unknown[];
    total: number;
  }> {
    const sessions = await this.repo.query(
      `SELECT s.*, json_agg(json_build_object(
        'studentId', a.student_id,
        'status', a.status,
        'recordedAt', a.recorded_at
      )) as attendance
       FROM study_sessions s
       LEFT JOIN attendance a ON s.id = a.session_id
       WHERE s.student_id = $1
       GROUP BY s.id
       ORDER BY s.start_time DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );

    const countResult = await this.repo.query(
      'SELECT COUNT(*) as count FROM study_sessions WHERE student_id = $1',
      [studentId]
    );

    return {
      sessions,
      total: (countResult[0] as { count: number }).count || 0,
    };
  }
}
