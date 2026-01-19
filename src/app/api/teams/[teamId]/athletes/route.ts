import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { AthleteCreateSchema } from '@/lib/api-schemas';
import {
  validationError,
  unauthorizedError,
  forbiddenError,
  errorResponse,
  serverError,
} from '@/lib/api-utils';
import { ZodError } from 'zod';

type RouteParams = { params: Promise<{ teamId: string }> };

// GET /api/teams/[teamId]/athletes - List athletes
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

    // Fetch athletes
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select('*')
      .eq('team_id', teamId)
      .order('jersey_number', { ascending: true });

    if (athletesError) {
      console.error('Error fetching athletes:', athletesError);
      return serverError('Failed to fetch athletes');
    }

    return NextResponse.json({ athletes: athletes || [] });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/athletes:', error);
    return serverError();
  }
}

// POST /api/teams/[teamId]/athletes - Create athlete
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
    const validated = AthleteCreateSchema.parse(body);

    // Create athlete
    const { data: athlete, error: createError } = await supabase
      .from('athletes')
      .insert({
        team_id: teamId,
        ...validated,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating athlete:', createError);
      if (createError.code === '23505') {
        return errorResponse('An athlete with this jersey number already exists', 400);
      }
      return serverError('Failed to create athlete');
    }

    return NextResponse.json({ athlete }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    console.error('Error in POST /api/teams/[teamId]/athletes:', error);
    return serverError();
  }
}
