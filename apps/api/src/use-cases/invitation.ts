import { PostgresRepository } from '../repository';
import { CreateInvitationInput, UserRole } from '../domain';
import { createAuthUser } from '../supabase-client';
import crypto from 'crypto';

export class InvitationUseCase {
  constructor(private repo: PostgresRepository) {}

  /**
   * Create invitation
   */
  async createInvitation(
    input: CreateInvitationInput,
    userId: string,
    tenantId: string
  ): Promise<{ token: string; expiresAt: string }> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.repo.insert('invitations', {
      email: input.email,
      role: input.role,
      token,
      expires_at: expiresAt.toISOString(),
      created_by: userId,
    });

    return {
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(
    token: string,
    password: string,
    fullName: string
  ): Promise<{ userId: string; tenantId: string }> {
    // Find invitation
    const invitations = await this.repo.query(
      'SELECT * FROM invitations WHERE token = $1 AND accepted = FALSE',
      [token]
    );

    if (!invitations || invitations.length === 0) {
      throw new Error('Invitation not found or already accepted');
    }

    const invitation = invitations[0] as {
      id: string;
      email: string;
      role: UserRole;
      tenant_id: string;
      expires_at: string;
    };

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Create auth user
    const authUser = await createAuthUser(invitation.email, password, {
      fullName,
      role: invitation.role,
    });

    if (!authUser) {
      throw new Error('Failed to create user');
    }

    // Create user profile
    await this.repo.insert('users', {
      id: authUser.id,
      email: invitation.email,
      full_name: fullName,
    });

    // Create user_tenant relationship
    await this.repo.insert('user_tenants', {
      user_id: authUser.id,
      tenant_id: invitation.tenant_id,
      role: invitation.role,
    });

    // Mark invitation as accepted
    await this.repo.update(
      'invitations',
      {
        accepted: true,
        accepted_at: new Date().toISOString(),
      },
      { id: invitation.id }
    );

    return {
      userId: authUser.id,
      tenantId: invitation.tenant_id,
    };
  }
}
