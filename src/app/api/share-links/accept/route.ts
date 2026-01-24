/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerClient, createServiceClient } from '@/lib/supabase-server';
import { ShareLinkValidateSchema } from '@/lib/api-schemas';
import {
  validationError,
  unauthorizedError,
  errorResponse,
  serverError,
  hashToken,
} from '@/lib/api-utils';
import { ZodError } from 'zod';

// POST /api/share-links/accept - Accept a share link (requires auth)
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = ShareLinkValidateSchema.parse(body);

    // Hash the token
    const tokenHash = hashToken(validated.token);

    // Use service client for share link lookup and update
    const serviceClient = createServiceClient();

    // Look up share link by hash
    const { data: shareLink, error: fetchError } = await serviceClient
      .from('share_links')
      .select('id, resource_type, resource_id, role, expires_at, revoked_at, max_uses, use_count')
      .eq('token_hash', tokenHash)
      .single();

    if (fetchError || !shareLink) {
      return errorResponse('Invalid or expired share link', 400);
    }

    // Validate share link
    if (shareLink.revoked_at) {
      return errorResponse('This share link has been revoked', 400);
    }

    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return errorResponse('This share link has expired', 400);
    }

    if (shareLink.max_uses && shareLink.use_count >= shareLink.max_uses) {
      return errorResponse('This share link has reached its maximum uses', 400);
    }

    // Determine team_id based on resource type
    let teamId: string;
    if (shareLink.resource_type === 'team') {
      teamId = shareLink.resource_id;
    } else if (shareLink.resource_type === 'lineup') {
      // Fetch lineup to get team_id
      const { data: lineup, error: lineupError } = await serviceClient
        .from('lineups')
        .select('team_id')
        .eq('id', shareLink.resource_id)
        .single();

      if (lineupError || !lineup) {
        return errorResponse('Resource not found', 404);
      }
      teamId = lineup.team_id;
    } else {
      return errorResponse('Invalid resource type', 400);
    }

    // Check if user is already a member
    const { data: existingMembership, error: memberError } = await serviceClient
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!memberError && existingMembership) {
      // User already a member - return success without changing role
      return NextResponse.json({
        success: true,
        message: 'You are already a member of this team',
        team_id: teamId,
        role: existingMembership.role,
        already_member: true,
      });
    }

    // Add user as team member with share link role
    const { error: insertError } = await serviceClient
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: user.id,
        role: shareLink.role,
      });

    if (insertError) {
      console.error('Error adding team member:', insertError);
      return serverError('Failed to join team');
    }

    // Increment use count
    await serviceClient
      .from('share_links')
      .update({ use_count: shareLink.use_count + 1 })
      .eq('id', shareLink.id);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined team',
      team_id: teamId,
      role: shareLink.role,
      already_member: false,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    console.error('Error in POST /api/share-links/accept:', error);
    return serverError();
  }
}
