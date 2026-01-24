/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { LineupUpdateSchema } from '@/lib/api-schemas';
import {
  validationError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  versionConflictError,
  serverError,
} from '@/lib/api-utils';
import { ZodError } from 'zod';
import type { Database } from '@/types/supabase';

type RouteParams = { params: Promise<{ lineupId: Database['public']['Tables']['lineups']['Row']['id'] }> };

// GET /api/lineups/[lineupId] - Get lineup with full state
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { lineupId } = await params;
    const lineupIdValue = lineupId as Database['public']['Tables']['lineups']['Row']['id'];
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Fetch lineup
    const { data: lineupData, error: lineupError } = await supabase
      .from('lineups')
      .select('*')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase type generation is manual in this workspace.
      .eq('id', lineupIdValue as any)
      .single();

    const lineup = lineupData as Database['public']['Tables']['lineups']['Row'] | null;

    if (lineupError || !lineup) {
      return notFoundError('Lineup');
    }

    // Check membership
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', lineup.team_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return forbiddenError();
    }

    return NextResponse.json({
      lineup,
      can_edit: membership.role === 'owner' || membership.role === 'editor',
    });
  } catch (error) {
    console.error('Error in GET /api/lineups/[lineupId]:', error);
    return serverError();
  }
}

// PATCH /api/lineups/[lineupId] - Update lineup with optimistic locking
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { lineupId } = await params;
    const lineupIdValue = lineupId as Database['public']['Tables']['lineups']['Row']['id'];
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Fetch current lineup to check ownership and version
    const { data: currentLineupData, error: lineupError } = await supabase
      .from('lineups')
      .select('team_id, state_version')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase type generation is manual in this workspace.
      .eq('id', lineupIdValue as any)
      .single();

    const currentLineup = currentLineupData as Database['public']['Tables']['lineups']['Row'] | null;

    if (lineupError || !currentLineup) {
      return notFoundError('Lineup');
    }

    // Check if user can write (editor or owner)
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', currentLineup.team_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || membership.role === 'viewer') {
      return forbiddenError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = LineupUpdateSchema.parse(body);

    // Check version for optimistic locking
    if (validated.state_version !== currentLineup.state_version) {
      return versionConflictError(currentLineup.state_version, validated.state_version);
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      state_version: currentLineup.state_version + 1,
    };

    if (validated.name !== undefined) {
      updateData.name = validated.name;
    }

    if (validated.state !== undefined) {
      updateData.state = validated.state;
    }

    // Update lineup with version check
    const { data: lineup, error: updateError } = await supabase
      .from('lineups')
      .update(updateData)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase type generation is manual in this workspace.
      .eq('id', lineupIdValue as any)
      .eq('state_version', currentLineup.state_version) // Double-check version hasn't changed
      .select()
      .single();

    if (updateError) {
      console.error('Error updating lineup:', updateError);
      // If no rows updated, version conflict occurred
      if (updateError.code === 'PGRST116') {
        return versionConflictError(currentLineup.state_version + 1, validated.state_version);
      }
      return serverError('Failed to update lineup');
    }

    if (!lineup) {
      // Version conflict - another update happened
      return versionConflictError(currentLineup.state_version + 1, validated.state_version);
    }

    return NextResponse.json({ lineup });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    console.error('Error in PATCH /api/lineups/[lineupId]:', error);
    return serverError();
  }
}

// DELETE /api/lineups/[lineupId] - Delete lineup
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { lineupId } = await params;
    const lineupIdValue = lineupId as Database['public']['Tables']['lineups']['Row']['id'];
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Fetch lineup to check ownership
    const { data: lineupData, error: lineupError } = await supabase
      .from('lineups')
      .select('team_id')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase type generation is manual in this workspace.
      .eq('id', lineupIdValue as any)
      .single();

    const lineup = lineupData as Database['public']['Tables']['lineups']['Row'] | null;

    if (lineupError || !lineup) {
      return notFoundError('Lineup');
    }

    // Check if user can write (editor or owner)
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', lineup.team_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || membership.role === 'viewer') {
      return forbiddenError();
    }

    // Delete lineup
    const { error: deleteError } = await supabase
      .from('lineups')
      .delete()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase type generation is manual in this workspace.
      .eq('id', lineupIdValue as any);

    if (deleteError) {
      console.error('Error deleting lineup:', deleteError);
      return serverError('Failed to delete lineup');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/lineups/[lineupId]:', error);
    return serverError();
  }
}
