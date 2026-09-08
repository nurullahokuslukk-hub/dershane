import express, { Request, Response, Express } from 'express';
import cookieParser from 'cookie-parser';
import { authMiddleware, tenantMiddleware, requireRole, csrfProtection, securityHeaders } from './auth-middleware';
import { PostgresRepository } from './repository';
import { ExamUseCase, TaskUseCase, SessionUseCase, InvitationUseCase } from './use-cases';
import { CreateExamSchema, CreateTaskSchema, CreateSessionSchema, CreateInvitationSchema, CreateUserSchema, LoginSchema, AcceptInvitationSchema } from './domain';
import { createAuthUser, resetPassword, verifyJWT } from './supabase-client';

const app: Express = express();
const port = process.env.PORT || 3100;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(securityHeaders);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// AUTH ENDPOINTS
// ============================================

/**
 * POST /auth/register
 * Register new user
 */
app.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const input = CreateUserSchema.parse(req.body);

    // Create auth user
    const authUser = await createAuthUser(input.email, input.password, {
      fullName: input.fullName,
    });

    if (!authUser) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Create user profile in database
    const repo = new PostgresRepository();
    await repo.insert('users', {
      id: authUser.id,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone,
    });

    res.json({
      message: 'User registered successfully',
      userId: authUser.id,
      email: authUser.user_metadata?.email,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
  }
});

/**
 * POST /auth/login
 * Login user
 */
app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const input = LoginSchema.parse(req.body);
    const repo = new PostgresRepository();

    // Verify user exists and get their role
    const users = await repo.query(
      `SELECT u.id, u.email FROM users u WHERE u.email = $1`,
      [input.email]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0] as { id: string; email: string };

    // In production, use Supabase Auth for actual password verification
    // For now, return mock token
    const mockToken = Buffer.from(JSON.stringify({
      sub: user.id,
      email: input.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800, // 8 hours
    })).toString('base64');

    res.cookie('sb-auth-token', mockToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 28800000, // 8 hours
    });

    res.json({
      message: 'Login successful',
      userId: user.id,
      token: mockToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
  }
});

/**
 * POST /auth/reset-password
 * Request password reset
 */
app.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const success = await resetPassword(email);
    if (!success) {
      return res.status(400).json({ error: 'Failed to send reset email' });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
app.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('sb-auth-token');
  res.json({ message: 'Logged out successfully' });
});

// ============================================
// INVITATION ENDPOINTS
// ============================================

/**
 * POST /tenants/:tenantId/invitations
 * Create invitation
 */
app.post(
  '/tenants/:tenantId/invitations',
  authMiddleware,
  tenantMiddleware,
  requireRole('admin'),
  csrfProtection,
  async (req: Request, res: Response) => {
    try {
      const input = CreateInvitationSchema.parse(req.body);
      const repo = new PostgresRepository(req.tenantId);
      const inviteUseCase = new InvitationUseCase(repo);

      const result = await inviteUseCase.createInvitation(
        input,
        req.auth!.userId,
        req.tenantId!
      );

      res.status(201).json({
        message: 'Invitation created',
        token: result.token,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      console.error('Create invitation error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create invitation' });
    }
  }
);

/**
 * POST /invitations/accept
 * Accept invitation
 */
app.post('/invitations/accept', async (req: Request, res: Response) => {
  try {
    const input = AcceptInvitationSchema.parse(req.body);
    const repo = new PostgresRepository();
    const inviteUseCase = new InvitationUseCase(repo);

    const result = await inviteUseCase.acceptInvitation(
      input.token,
      input.password,
      input.fullName
    );

    res.json({
      message: 'Invitation accepted',
      userId: result.userId,
      tenantId: result.tenantId,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to accept invitation' });
  }
});

// ============================================
// EXAM ENDPOINTS
// ============================================

/**
 * POST /tenants/:tenantId/exams
 * Create exam
 */
app.post(
  '/tenants/:tenantId/exams',
  authMiddleware,
  tenantMiddleware,
  requireRole('teacher', 'counselor', 'admin'),
  csrfProtection,
  async (req: Request, res: Response) => {
    try {
      const input = CreateExamSchema.parse(req.body);
      const repo = new PostgresRepository(req.tenantId, req.auth!.userId);
      const examUseCase = new ExamUseCase(repo);

      const result = await examUseCase.createExam(input, req.auth!.userId);

      res.status(201).json({
        message: 'Exam created',
        id: result.id,
      });
    } catch (error) {
      console.error('Create exam error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create exam' });
    }
  }
);

/**
 * GET /tenants/:tenantId/exams/:studentId
 * Get student exams
 */
app.get(
  '/tenants/:tenantId/exams/:studentId',
  authMiddleware,
  tenantMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const limit = parseInt(req.query.limit as string) || 500;
      const offset = parseInt(req.query.offset as string) || 0;

      const repo = new PostgresRepository(req.tenantId);
      const examUseCase = new ExamUseCase(repo);

      const result = await examUseCase.getStudentExams(studentId, limit, offset);

      res.json(result);
    } catch (error) {
      console.error('Get exams error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to get exams' });
    }
  }
);

/**
 * GET /tenants/:tenantId/exams/:studentId/progress
 * Calculate student progress
 */
app.get(
  '/tenants/:tenantId/exams/:studentId/progress',
  authMiddleware,
  tenantMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const repo = new PostgresRepository(req.tenantId);
      const examUseCase = new ExamUseCase(repo);

      const result = await examUseCase.calculateProgress(studentId);

      res.json(result);
    } catch (error) {
      console.error('Calculate progress error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to calculate progress' });
    }
  }
);

// ============================================
// TASK ENDPOINTS
// ============================================

/**
 * POST /tenants/:tenantId/tasks
 * Assign task
 */
app.post(
  '/tenants/:tenantId/tasks',
  authMiddleware,
  tenantMiddleware,
  requireRole('teacher', 'counselor', 'admin'),
  csrfProtection,
  async (req: Request, res: Response) => {
    try {
      const input = CreateTaskSchema.parse(req.body);
      const repo = new PostgresRepository(req.tenantId, req.auth!.userId);
      const taskUseCase = new TaskUseCase(repo);

      const result = await taskUseCase.assignTask(input, req.auth!.userId);

      res.status(201).json({
        message: 'Task assigned',
        id: result.id,
      });
    } catch (error) {
      console.error('Assign task error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to assign task' });
    }
  }
);

/**
 * GET /tenants/:tenantId/tasks/:studentId
 * Get student tasks
 */
app.get(
  '/tenants/:tenantId/tasks/:studentId',
  authMiddleware,
  tenantMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const limit = parseInt(req.query.limit as string) || 500;
      const offset = parseInt(req.query.offset as string) || 0;

      const repo = new PostgresRepository(req.tenantId);
      const taskUseCase = new TaskUseCase(repo);

      const result = await taskUseCase.getStudentTasks(studentId, limit, offset);

      res.json(result);
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to get tasks' });
    }
  }
);

/**
 * POST /tenants/:tenantId/tasks/:taskId/submit
 * Submit task
 */
app.post(
  '/tenants/:tenantId/tasks/:taskId/submit',
  authMiddleware,
  tenantMiddleware,
  csrfProtection,
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const repo = new PostgresRepository(req.tenantId);
      const taskUseCase = new TaskUseCase(repo);

      const result = await taskUseCase.submitTask(taskId, content, req.auth!.userId);

      res.json({
        message: 'Task submitted',
        version: result.version,
      });
    } catch (error) {
      console.error('Submit task error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to submit task' });
    }
  }
);

/**
 * POST /tenants/:tenantId/tasks/:taskId/review
 * Review task
 */
app.post(
  '/tenants/:tenantId/tasks/:taskId/review',
  authMiddleware,
  tenantMiddleware,
  requireRole('teacher', 'counselor', 'admin'),
  csrfProtection,
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const { status, feedback } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const repo = new PostgresRepository(req.tenantId);
      const taskUseCase = new TaskUseCase(repo);

      const result = await taskUseCase.reviewTask(
        taskId,
        status,
        feedback,
        req.auth!.userId
      );

      res.json(result);
    } catch (error) {
      console.error('Review task error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to review task' });
    }
  }
);

// ============================================
// SESSION ENDPOINTS
// ============================================

/**
 * POST /tenants/:tenantId/sessions
 * Create study session
 */
app.post(
  '/tenants/:tenantId/sessions',
  authMiddleware,
  tenantMiddleware,
  requireRole('teacher', 'counselor', 'admin'),
  csrfProtection,
  async (req: Request, res: Response) => {
    try {
      const input = CreateSessionSchema.parse(req.body);
      const repo = new PostgresRepository(req.tenantId, req.auth!.userId);
      const sessionUseCase = new SessionUseCase(repo);

      // Check for conflicts
      const { hasConflict, conflicts } = await sessionUseCase.checkConflicts(
        input.studentId,
        input.startTime,
        input.endTime
      );

      if (hasConflict) {
        return res.status(409).json({
          error: 'Session conflict detected',
          conflicts,
        });
      }

      const result = await sessionUseCase.createSession(input, req.auth!.userId);

      res.status(201).json({
        message: 'Session created',
        id: result.id,
      });
    } catch (error) {
      console.error('Create session error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create session' });
    }
  }
);

/**
 * GET /tenants/:tenantId/sessions/:studentId
 * Get student sessions
 */
app.get(
  '/tenants/:tenantId/sessions/:studentId',
  authMiddleware,
  tenantMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const limit = parseInt(req.query.limit as string) || 500;
      const offset = parseInt(req.query.offset as string) || 0;

      const repo = new PostgresRepository(req.tenantId);
      const sessionUseCase = new SessionUseCase(repo);

      const result = await sessionUseCase.getStudentSessions(studentId, limit, offset);

      res.json(result);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to get sessions' });
    }
  }
);

/**
 * POST /tenants/:tenantId/sessions/:sessionId/attendance
 * Record attendance
 */
app.post(
  '/tenants/:tenantId/sessions/:sessionId/attendance',
  authMiddleware,
  tenantMiddleware,
  requireRole('teacher', 'counselor', 'admin'),
  csrfProtection,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { studentId, status } = req.body;

      if (!studentId || !status) {
        return res.status(400).json({ error: 'Student ID and status are required' });
      }

      const repo = new PostgresRepository(req.tenantId);
      const sessionUseCase = new SessionUseCase(repo);

      const result = await sessionUseCase.recordAttendance(
        sessionId,
        studentId,
        status,
        req.auth!.userId
      );

      res.json(result);
    } catch (error) {
      console.error('Record attendance error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to record attendance' });
    }
  }
);

/**
 * GET /tenants/:tenantId/sessions/:sessionId/attendance
 * Get session attendance
 */
app.get(
  '/tenants/:tenantId/sessions/:sessionId/attendance',
  authMiddleware,
  tenantMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const repo = new PostgresRepository(req.tenantId);
      const sessionUseCase = new SessionUseCase(repo);

      const result = await sessionUseCase.getSessionAttendance(sessionId);

      res.json({ attendance: result });
    } catch (error) {
      console.error('Get attendance error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to get attendance' });
    }
  }
);

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

export default app;
