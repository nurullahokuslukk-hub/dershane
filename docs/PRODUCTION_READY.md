# Production Ready Implementation Guide

## Overview
This guide provides comprehensive instructions for transitioning Dershane from development (SQLite) to production (Supabase/PostgreSQL).

**Status**: v0.2 Development → v1.0 Production Ready

---

## Phase 1: Database & Authentication Layer

### 1.1 Supabase Project Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Create new Supabase project
supabase projects create --name dershane-prod

# Link to project
supabase link --project-id your-project-id

# Run migrations
supabase migration up
```

### 1.2 Environment Variables

Create `.env.production`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Application
APP_URL=https://dershane.example.com
NODE_ENV=production
PORT=3100

# Security
CSRF_TOKEN_SECRET=generate-secure-random
SESSION_SECRET=generate-secure-random
```

### 1.3 Data Migration from SQLite to PostgreSQL

```bash
# 1. Export SQLite data
npm run export:sqlite

# 2. Validate data integrity
npm run validate:migration

# 3. Import to PostgreSQL (staging)
npm run import:postgres:staging

# 4. Run consistency checks
npm run verify:data

# 5. Switch to production
npm run migrate:prod
```

### 1.4 RLS (Row Level Security) Verification

```bash
# Test RLS policies
npm run test:rls

# Expected results:
# ✅ Student can only see own data
# ✅ Teacher cannot access other tenant data
# ✅ Admin can access tenant data
# ✅ Cross-tenant queries return 403
```

---

## Phase 2: Authentication & Authorization

### 2.1 Supabase Auth Setup

```bash
# Enable Auth providers
supabase --project-id your-id auth enable-provider email
supabase --project-id your-id auth enable-provider google  # Optional
supabase --project-id your-id auth enable-provider microsoft  # Optional
```

### 2.2 JWT Token Configuration

```typescript
// apps/api/src/supabase-client.ts

// Tokens:
// - Access token: 1 hour expiration
// - Refresh token: 7 days expiration
// - Session: HttpOnly cookie, SameSite=Strict
```

### 2.3 Password Security

```bash
# Hashing algorithm: Scrypt (N=32768, r=8, p=1)
# Min password: 8 characters
# Password reset: Email link valid for 24 hours
# MFA: TOTP-based (optional)
```

---

## Phase 3: Kurum (Organization) & Tenant Management

### 3.1 Admin Panel

Endpoints for system administrators:

```bash
POST   /admin/tenants              # Create new tenant (school)
GET    /admin/tenants/:id          # Get tenant details
PATCH  /admin/tenants/:id          # Update tenant
DELETE /admin/tenants/:id          # Soft delete tenant

POST   /admin/tenants/:id/orgs     # Create branch/class
POST   /admin/tenants/:id/users    # Invite user
PATCH  /admin/users/:id/role       # Change user role (admin only)
```

### 3.2 User Onboarding

1. **Admin creates tenant** (school/organization)
2. **Admin sends invitations** to teachers, counselors
3. **Teachers/counselors accept invitations** (set password)
4. **Students invited by teachers** or bulk imported
5. **Parents/guardians** can access via student consent

### 3.3 Role-Based Access Control (RBAC)

| Role | Exams | Tasks | Sessions | Attendance | Reports |
|------|-------|-------|----------|-----------|----------|
| **Admin** | R/W | R/W | R/W | R/W | R |
| **Teacher** | R/W (own) | R/W (assigned) | R/W (own) | R/W | R (own) |
| **Counselor** | R | R | R/W | R/W | R |
| **Student** | R (own) | R/W (assigned) | R/W (own) | R | - |

---

## Phase 4: Data Integrity & Validation

### 4.1 Exam Entry Validation

```typescript
// Must validate:
✅ Total questions matches (C + W + B) × 4
✅ No negative numbers
✅ Divisor is positive
✅ No duplicate exams (same day + type + divisor)
✅ Exam date is not in future

// If validation fails:
400 Bad Request: Detailed error message
409 Conflict: "Exam already exists for this date"
```

### 4.2 Audit Logging

```typescript
// Every action logged:
- User ID, Timestamp, Action, Resource Type
- Old Values → New Values (for updates)
- IP Address, User Agent
- Tenant context

// Retention: 7 years (KVKK compliance)
```

### 4.3 Version Control for Exams

```bash
# Create exam
POST /exams → version 1

# Teacher corrects results
PATCH /exams/:id → version 2
→ Previous version stored in exam_history
→ Student sees update in progress tracking
```

---

## Phase 5: Android Integration

### 5.1 Offline Support

```kotlin
// Offline Queue (Room Database + WorkManager)
1. Create exam entry (no internet)
   → Store in local SQLite
   → Generate UUID (idempotent)
2. Connection restored
   → Send to server with clientId
   → Server checks idempotency hash
   → No duplicates created
3. Conflict (409)
   → Display "Data mismatch" screen
   → User can sync or retry
```

### 5.2 Build & Release

```bash
# Development
gradle -p android assembleDebug

# Production (signed)
gradle -p android assembleRelease

# Play Store
# - Target SDK: 36 (Android 12+)
# - Min SDK: 29 (Android 10+)
# - Sign with release key
# - Data Safety form required
```

---

## Phase 6: Compliance & Legal

### 6.1 KVKK (Turkish GDPR) Compliance

- **Data Classification**: Personal, Sensitive, Educational
- **Processing Basis**: Explicit consent + legitimate interest
- **Data Transfer**: Turkey-resident processing or EU-US agreement
- **Rights**: Access, rectification, erasure, portability

### 6.2 Data Deletion & Retention

```bash
# Student graduation (hard delete after 3 years)
DELETE FROM exams WHERE student_id = $1 AND graduation_date < NOW() - INTERVAL 3 YEAR
DELETE FROM tasks WHERE student_id = $1 AND graduation_date < NOW() - INTERVAL 3 YEAR

# Parent request (within 30 days)
Soft delete + anonymization + audit trail

# Retention policy
- Active students: Keep all data
- Graduated: Keep 3 years (KVKK)
- After deletion: Audit log only (7 years, encrypted)
```

### 6.3 Backup & Disaster Recovery

```bash
# Daily backups
- Time: 2:00 AM (UTC+3 Istanbul)
- Location: Encrypted S3 storage
- Retention: 30 days
- Test restore: Weekly

# RPO (Recovery Point Objective): 24 hours
# RTO (Recovery Time Objective): 4 hours

# Restore procedure
npm run restore:backup --date=2026-09-01
```

---

## Phase 7: Monitoring & Operations

### 7.1 Error Tracking

```bash
# Sentry setup
npm install @sentry/node

# Monitor:
- 500 errors
- Auth failures
- RLS violations
- Database connection issues
```

### 7.2 Performance Monitoring

```bash
# CloudWatch metrics
- API response time (target: <200ms)
- Database query time (target: <100ms)
- Error rate (target: <0.1%)
- Concurrent users
```

### 7.3 Alerting

```
Critical (immediate):
- Database down
- Auth service unavailable
- RLS policy violation

Warning (within 1 hour):
- Error rate > 1%
- Response time > 500ms
- CPU > 80%
```

---

## Phase 8: Staging & Testing

### 8.1 Staging Environment

```bash
# Clone production schema
supabase link --project-id staging-id
supabase migration up

# Load test data
npm run seed:staging

# Run full test suite
npm run test
npm run test:rls
npm run test:load  # 1000 concurrent users
```

### 8.2 Pre-Launch Checklist

- [ ] Database: Verified, backed up, RLS tested
- [ ] Auth: Email, password reset, MFA working
- [ ] API: All endpoints tested, rate limiting enabled
- [ ] Android: Signed APK, Play Store submission approved
- [ ] Web: SSL/TLS certificate, domain configured
- [ ] Monitoring: Sentry, CloudWatch, alerts active
- [ ] Documentation: Updated, team trained
- [ ] Legal: KVKK assessment, privacy policy, ToS approved
- [ ] Support: Help center, error messages, recovery procedures

---

## Phase 9: Launch

### 9.1 Deployment

```bash
# 1. Blue-green deployment
git checkout main
npm run build
npm run deploy:blue-green

# 2. Verify production
curl https://dershane.example.com/health

# 3. Enable monitoring
npm run enable:monitoring

# 4. Announce to users
# Email, in-app notification, social media
```

### 9.2 Rollback Plan

```bash
# If critical issue:
1. Switch traffic to previous version
2. Notify users
3. Investigate root cause
4. Fix + re-test
5. Deploy again

# Database rollback
npm run restore:backup --date=2026-09-08
```

---

## Documentation & Training

### Admin Guide
- Creating tenants, inviting users, managing roles
- Monitoring system health, backing up data
- Handling support requests

### Teacher Guide
- Entering exam results
- Assigning tasks, reviewing submissions
- Planning sessions, recording attendance

### Student Guide
- Viewing exam results and progress
- Submitting assignments
- Accessing study sessions

### Support SOP
- Common issues and solutions
- Escalation procedure
- Emergency contacts

---

## Timeline Estimate

| Phase | Duration | Owner |
|-------|----------|-------|
| 1. Database & Auth | 2 weeks | Backend Team |
| 2. Tenant Management | 2 weeks | Backend + Admin Panel |
| 3. Data Migration | 1 week | DevOps + Backend |
| 4. Android Integration | 2 weeks | Mobile Team |
| 5. Compliance Review | 1 week | Legal + Compliance |
| 6. Staging & Testing | 1 week | QA Team |
| 7. Launch Prep | 1 week | All Teams |
| **Total** | **~10 weeks** | |

---

## Success Metrics

- ✅ Zero data loss during migration
- ✅ 99.9% uptime SLA
- ✅ All RLS policies pass security audit
- ✅ KVKK compliance verified
- ✅ <200ms API response time (p95)
- ✅ 100% of automated tests passing
- ✅ All stakeholders trained

---

## Support

For questions or issues:
1. Check this guide first
2. Review inline code comments
3. Check GitHub issues: https://github.com/nurullahokuslukk-hub/dershane/issues
4. Contact: support@dershane.example.com
