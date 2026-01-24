/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { TeamUpdateSchema } from '@/lib/api-schemas';
import {
  validationError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  serverError,
} from '@/lib/api-utils';
import { ZodError } from 'zod';

type RouteParams = { params: Promise<{ teamId: string }> };

// GET /api/teams/[teamId] - Get team details
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Check membership and get role
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return forbiddenError();
    }

    // Fetch team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return notFoundError('Team');
    }

    return NextResponse.json({ team: { ...team, role: membership.role } });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]:', error);
    return serverError();
  }
}

// PATCH /api/teams/[teamId] - Update team
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Check if user is owner
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || membership.role !== 'owner') {
      return forbiddenError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = TeamUpdateSchema.parse(body);

    // Update team
    const { data: team, error: updateError } = await supabase
      .from('teams')
      .update(validated)
      .eq('id', teamId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating team:', updateError);
      return serverError('Failed to update team');
    }

    return NextResponse.json({ team: { ...team, role: 'owner' } });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    console.error('Error in PATCH /api/teams/[teamId]:', error);
    return serverError();
  }
}

// DELETE /api/teams/[teamId] - Delete (archive) team
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Check if user is owner
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || membership.role !== 'owner') {
      return forbiddenError();
    }

    // Soft delete by setting archived_at
    const { error: updateError } = await supabase
      .from('teams')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', teamId);

    if (updateError) {
      console.error('Error archiving team:', updateError);
      return serverError('Failed to archive team');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/teams/[teamId]:', error);
    return serverError();
  }
}
