/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { LineupCreateSchema } from '@/lib/api-schemas';
import {
  validationError,
  unauthorizedError,
  forbiddenError,
  serverError,
} from '@/lib/api-utils';
import { ZodError } from 'zod';
import { DEFAULT_LINEUP_STATE } from '@/types/lineup-state';

type RouteParams = { params: Promise<{ teamId: string }> };

// GET /api/teams/[teamId]/lineups - List lineups
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Check membership
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return forbiddenError();
    }

    // Fetch lineups (without full state for list view)
    const { data: lineups, error: lineupsError } = await supabase
      .from('lineups')
      .select('id, name, created_at, updated_at, state_version')
      .eq('team_id', teamId)
      .order('updated_at', { ascending: false });

    if (lineupsError) {
      console.error('Error fetching lineups:', lineupsError);
      return serverError('Failed to fetch lineups');
    }

    return NextResponse.json({ lineups: lineups || [] });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/lineups:', error);
    return serverError();
  }
}

// POST /api/teams/[teamId]/lineups - Create lineup
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Check if user can write (editor or owner)
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || membership.role === 'viewer') {
      return forbiddenError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = LineupCreateSchema.parse(body);

    // Create lineup with default state
    const { data: lineup, error: createError } = await supabase
      .from('lineups')
      .insert({
        team_id: teamId,
        name: validated.name,
        state: validated.state || DEFAULT_LINEUP_STATE,
        state_version: 1,
        players: [], // Legacy field, keep for backwards compatibility
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating lineup:', createError);
      return serverError('Failed to create lineup');
    }

    return NextResponse.json({ lineup }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    console.error('Error in POST /api/teams/[teamId]/lineups:', error);
    return serverError();
  }
}
