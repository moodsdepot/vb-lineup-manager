import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { TeamCreateSchema } from '@/lib/api-schemas';
import {
  errorResponse,
  validationError,
  unauthorizedError,
  serverError,
  generateTeamCode,
} from '@/lib/api-utils';
import { ZodError } from 'zod';

// GET /api/teams - List user's teams
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Get teams where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id);

    if (memberError) {
      console.error('Error fetching memberships:', memberError);
      return serverError('Failed to fetch team memberships');
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    const teamIds = memberships.map((m) => m.team_id);

    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return serverError('Failed to fetch teams');
    }

    // Combine teams with user's role
    const teamsWithRoles = teams?.map((team) => ({
      ...team,
      role: memberships.find((m) => m.team_id === team.id)?.role || 'viewer',
    })) || [];

    return NextResponse.json({ teams: teamsWithRoles });
  } catch (error) {
    console.error('Error in GET /api/teams:', error);
    return serverError();
  }
}

// POST /api/teams - Create a new team
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = TeamCreateSchema.parse(body);

    // Generate a unique team code
    const teamCode = generateTeamCode();

    // Create team using RPC function (handles team + owner membership atomically)
    const { data: teamId, error: rpcError } = await supabase.rpc('create_team_and_add_owner', {
      p_team_name: validated.name,
      p_team_code: teamCode,
      p_user_id: user.id,
    });

    if (rpcError) {
      console.error('Error creating team:', rpcError);
      if (rpcError.code === '23505') {
        return errorResponse('Failed to generate unique team code, please try again', 500);
      }
      return serverError('Failed to create team');
    }

    // Fetch the created team
    const { data: team, error: fetchError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (fetchError || !team) {
      console.error('Error fetching created team:', fetchError);
      return serverError('Team created but failed to fetch details');
    }

    return NextResponse.json(
      { team: { ...team, role: 'owner' } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    console.error('Error in POST /api/teams:', error);
    return serverError();
  }
}
