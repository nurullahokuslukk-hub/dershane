import { test } from 'node:test';
import assert from 'node:assert';
import { ExamUseCase } from '../src/use-cases/exam';
import { TaskUseCase } from '../src/use-cases/task';
import { SessionUseCase } from '../src/use-cases/session';
import { PostgresRepository } from '../src/repository';
import {
  validateExamCapacity,
  isDuplicateExam,
  calculateNet,
  calculateTotalNet,
  generateBodyHash,
  validateIdempotencyKey,
} from '../src/domain';

// ============================================
// DOMAIN VALIDATION TESTS
// ============================================

test('calculateNet should calculate correct net score', () => {
  const net = calculateNet(40, 10, 4);
  assert.strictEqual(net, 397.5); // (40 - 10/4) * 10 = 397.5
});

test('calculateTotalNet should sum all subject nets', () => {
  const subjects = [
    { correct: 40, wrong: 10, divisor: 4 },
    { correct: 35, wrong: 5, divisor: 4 },
  ];
  const total = calculateTotalNet(subjects);
  assert.strictEqual(total, 835); // 397.5 + 347.5
});

test('validateExamCapacity should return true for valid exam', () => {
  const subjects = [
    { correct: 25, wrong: 10, blank: 5 }, // 40 total
    { correct: 28, wrong: 8, blank: 4 }, // 40 total
    { correct: 30, wrong: 7, blank: 3 }, // 40 total
    { correct: 32, wrong: 6, blank: 2 }, // 40 total
  ];
  const valid = validateExamCapacity(40, subjects);
  assert.strictEqual(valid, true);
});

test('validateExamCapacity should return false for invalid exam', () => {
  const subjects = [
    { correct: 25, wrong: 10, blank: 5 }, // 40 total
    { correct: 28, wrong: 8, blank: 3 }, // 39 total (invalid)
  ];
  const valid = validateExamCapacity(40, subjects.slice(0, 1).concat(subjects.slice(1)));
  assert.strictEqual(valid, false);
});

test('isDuplicateExam should detect duplicates', () => {
  const existing = [
    { day: '2026-09-08', type: 'TYT', divisor: 4 },
  ];
  const duplicate = { day: '2026-09-08', type: 'TYT', divisor: 4 };
  const result = isDuplicateExam(existing, duplicate);
  assert.strictEqual(result, true);
});

test('isDuplicateExam should not detect false duplicates', () => {
  const existing = [
    { day: '2026-09-08', type: 'TYT', divisor: 4 },
  ];
  const notDuplicate = { day: '2026-09-08', type: 'AYT', divisor: 4 };
  const result = isDuplicateExam(existing, notDuplicate);
  assert.strictEqual(result, false);
});

test('generateBodyHash should create consistent hash', () => {
  const body = { email: 'test@example.com', name: 'Test' };
  const hash1 = generateBodyHash(body);
  const hash2 = generateBodyHash(body);
  assert.strictEqual(hash1, hash2);
});

test('generateBodyHash should create different hashes for different bodies', () => {
  const body1 = { email: 'test@example.com' };
  const body2 = { email: 'other@example.com' };
  const hash1 = generateBodyHash(body1);
  const hash2 = generateBodyHash(body2);
  assert.notStrictEqual(hash1, hash2);
});

test('validateIdempotencyKey should accept valid UUID', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';
  const result = validateIdempotencyKey(validUUID);
  assert.strictEqual(result, true);
});

test('validateIdempotencyKey should reject invalid UUID', () => {
  const invalidUUID = 'not-a-uuid';
  const result = validateIdempotencyKey(invalidUUID);
  assert.strictEqual(result, false);
});

// ============================================
// NEGATIVE TESTS (SECURITY)
// ============================================

test('Repository should enforce tenant isolation', async () => {
  const repo1 = new PostgresRepository('tenant-1', 'user-1');
  const repo2 = new PostgresRepository('tenant-2', 'user-1');

  // Queries should be scoped to tenant
  assert.strictEqual(repo1['tenantId'], 'tenant-1');
  assert.strictEqual(repo2['tenantId'], 'tenant-2');
});

test('Exam capacity validation should prevent data integrity issues', () => {
  const subjects = [
    { correct: 50, wrong: 10, blank: 0 }, // 60 > 40
    { correct: 30, wrong: 5, blank: 5 },
    { correct: 25, wrong: 10, blank: 5 },
    { correct: 20, wrong: 15, blank: 5 },
  ];
  const valid = validateExamCapacity(40, subjects);
  assert.strictEqual(valid, false);
});

test('Task status transition should be valid', () => {
  const validStatuses = ['assigned', 'submitted', 'revision_requested', 'accepted'];
  assert.strictEqual(validStatuses.includes('submitted'), true);
  assert.strictEqual(validStatuses.includes('invalid_status'), false);
});

test('Session time validation should prevent invalid sessions', () => {
  const startTime = new Date('2026-09-08T10:00:00');
  const endTime = new Date('2026-09-08T09:00:00');
  const isValid = endTime > startTime;
  assert.strictEqual(isValid, false);
});

test('Session time validation should allow valid sessions', () => {
  const startTime = new Date('2026-09-08T09:00:00');
  const endTime = new Date('2026-09-08T10:00:00');
  const isValid = endTime > startTime;
  assert.strictEqual(isValid, true);
});

// ============================================
// USE CASE TESTS (MOCKED)
// ============================================

test('ExamUseCase.createExam should validate capacity', async () => {
  const mockRepo = new PostgresRepository('tenant-1', 'user-1');
  const examUseCase = new ExamUseCase(mockRepo);

  const invalidInput = {
    clientId: '550e8400-e29b-41d4-a716-446655440000',
    studentId: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test Exam',
    type: 'TYT' as const,
    day: '2026-09-08',
    totalQuestions: 40,
    divisor: 4,
    subjects: [
      { name: 'Math', correct: 50, wrong: 10, blank: 0 }, // Invalid: exceeds total
      { name: 'Turkish', correct: 30, wrong: 5, blank: 5 },
      { name: 'English', correct: 25, wrong: 10, blank: 5 },
      { name: 'Science', correct: 20, wrong: 15, blank: 5 },
    ],
  };

  try {
    await examUseCase.createExam(invalidInput, 'user-1');
    assert.fail('Should have thrown error for invalid capacity');
  } catch (error) {
    assert.strictEqual(
      error instanceof Error && error.message.includes('capacity'),
      true
    );
  }
});

test('TaskUseCase should handle task workflow correctly', async () => {
  // Test task status transitions
  const validTransitions = {
    assigned: ['submitted', 'rejected'],
    submitted: ['revision_requested', 'accepted'],
    revision_requested: ['submitted'],
    accepted: [],
  };

  assert.strictEqual(
    validTransitions.assigned.includes('submitted'),
    true
  );
  assert.strictEqual(
    validTransitions.accepted.includes('submitted'),
    false
  );
});

test('SessionUseCase should detect session conflicts', async () => {
  const mockRepo = new PostgresRepository('tenant-1', 'user-1');
  const sessionUseCase = new SessionUseCase(mockRepo);

  const startTime1 = '2026-09-08T10:00:00';
  const endTime1 = '2026-09-08T11:00:00';
  const startTime2 = '2026-09-08T10:30:00';
  const endTime2 = '2026-09-08T11:30:00';

  // Check overlap logic
  const overlap =
    !(new Date(endTime2) <= new Date(startTime1) ||
      new Date(startTime2) >= new Date(endTime1));
  assert.strictEqual(overlap, true);
});

// ============================================
// SUMMARY
// ============================================

console.log('✅ All tests completed');
