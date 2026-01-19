import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { ShareLinkCreateSchema } from '@/lib/api-schemas';
import {
  validationError,
  unauthorizedError,
  forbiddenError,
  serverError,
  hashToken,
  generateShareToken,
} from '@/lib/api-utils';
import { ZodError } from 'zod';

type RouteParams = { params: Promise<{ teamId: string }> };

// GET /api/teams/[teamId]/share-links - List share links for team
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Only owners can view share links
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || membership.role !== 'owner') {
      return forbiddenError();
    }

    // Fetch share links for this team
    const { data: shareLinks, error: fetchError } = await supabase
      .from('share_links')
      .select('id, resource_type, resource_id, role, expires_at, revoked_at, max_uses, use_count, created_at')
      .eq('resource_type', 'team')
      .eq('resource_id', teamId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching share links:', fetchError);
      return serverError('Failed to fetch share links');
    }

    return NextResponse.json({ share_links: shareLinks || [] });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/share-links:', error);
    return serverError();
  }
}

// POST /api/teams/[teamId]/share-links - Create share link for team
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Only owners can create share links
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
    const validated = ShareLinkCreateSchema.parse({
      ...body,
      resource_type: 'team',
      resource_id: teamId,
    });

    // Generate token and hash
    const token = generateShareToken();
    const tokenHash = hashToken(token);

    // Create share link (never store raw token)
    const { data: shareLink, error: createError } = await supabase
      .from('share_links')
      .insert({
        token_hash: tokenHash,
        resource_type: validated.resource_type,
        resource_id: validated.resource_id,
        role: validated.role,
        created_by: user.id,
        expires_at: validated.expires_at || null,
        max_uses: validated.max_uses || null,
      })
      .select('id, role, expires_at, max_uses')
      .single();

    if (createError) {
      console.error('Error creating share link:', createError);
      return serverError('Failed to create share link');
    }

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/s/${token}`;

    return NextResponse.json(
      {
        id: shareLink.id,
        token, // Only returned at creation time
        share_url: shareUrl,
        role: shareLink.role,
        expires_at: shareLink.expires_at,
        max_uses: shareLink.max_uses,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    console.error('Error in POST /api/teams/[teamId]/share-links:', error);
    return serverError();
  }
}
