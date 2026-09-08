import { PostgresRepository } from '../repository';
import { CreateTaskInput, TaskStatus, generateBodyHash } from '../domain';

export class TaskUseCase {
  constructor(private repo: PostgresRepository) {}

  /**
   * Assign task to student
   */
  async assignTask(
    input: CreateTaskInput,
    userId: string
  ): Promise<{ id: string }> {
    const bodyHash = generateBodyHash(input);

    const task = await this.repo.insert('tasks', {
      student_id: input.studentId,
      subject: input.subject,
      description: input.description,
      due_date: input.dueDate,
      status: TaskStatus.ASSIGNED,
      assigned_by: userId,
      client_id: input.clientId,
      body_hash: bodyHash,
    });

    if (!task || !('id' in task)) {
      throw new Error('Failed to assign task');
    }

    return { id: task.id as string };
  }

  /**
   * Submit task
   */
  async submitTask(
    taskId: string,
    content: string,
    studentId: string
  ): Promise<{ version: number }> {
    // Get current task
    const tasks = await this.repo.query(
      'SELECT * FROM tasks WHERE id = $1 AND student_id = $2',
      [taskId, studentId]
    );

    if (!tasks || tasks.length === 0) {
      throw new Error('Task not found');
    }

    const task = tasks[0] as { current_version: number };
    const newVersion = (task.current_version || 0) + 1;

    // Insert submission
    const submission = await this.repo.insert('task_submissions', {
      task_id: taskId,
      version: newVersion,
      content,
      submitted_by: studentId,
    });

    // Update task status
    await this.repo.update(
      'tasks',
      {
        status: TaskStatus.SUBMITTED,
        current_version: newVersion,
      },
      { id: taskId }
    );

    return { version: newVersion };
  }

  /**
   * Review task (accept or request revision)
   */
  async reviewTask(
    taskId: string,
    status: TaskStatus,
    feedback: string | undefined,
    userId: string
  ): Promise<{ success: boolean }> {
    if (![TaskStatus.ACCEPTED, TaskStatus.REVISION_REQUESTED].includes(status)) {
      throw new Error('Invalid status for review');
    }

    // Get current submission
    const submissions = await this.repo.query(
      `SELECT * FROM task_submissions 
       WHERE task_id = $1 
       ORDER BY version DESC 
       LIMIT 1`,
      [taskId]
    );

    if (!submissions || submissions.length === 0) {
      throw new Error('No submission found for this task');
    }

    // Update submission with review
    await this.repo.update(
      'task_submissions',
      {
        feedback,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      },
      { task_id: taskId, version: (submissions[0] as { version: number }).version }
    );

    // Update task status
    await this.repo.update(
      'tasks',
      { status },
      { id: taskId }
    );

    return { success: true };
  }

  /**
   * Get student tasks
   */
  async getStudentTasks(
    studentId: string,
    limit: number = 500,
    offset: number = 0
  ): Promise<{
    tasks: unknown[];
    total: number;
  }> {
    const tasks = await this.repo.query(
      `SELECT t.*, 
              json_agg(json_build_object(
                'version', ts.version,
                'content', ts.content,
                'submittedAt', ts.submitted_at,
                'feedback', ts.feedback,
                'reviewedBy', ts.reviewed_by,
                'reviewedAt', ts.reviewed_at
              )) as submissions
       FROM tasks t
       LEFT JOIN task_submissions ts ON t.id = ts.task_id
       WHERE t.student_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );

    const countResult = await this.repo.query(
      'SELECT COUNT(*) as count FROM tasks WHERE student_id = $1',
      [studentId]
    );

    return {
      tasks,
      total: (countResult[0] as { count: number }).count || 0,
    };
  }
}
