import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { ShareLinkValidateSchema } from '@/lib/api-schemas';
import {
  validationError,
  serverError,
  hashToken,
} from '@/lib/api-utils';
import { ZodError } from 'zod';

// POST /api/share-links/validate - Validate a share link token (public endpoint)
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = ShareLinkValidateSchema.parse(body);

    // Hash the token
    const tokenHash = hashToken(validated.token);

    // Use service client to bypass RLS for validation
    const supabase = createServiceClient();

    // Look up share link by hash
    const { data: shareLink, error: fetchError } = await supabase
      .from('share_links')
      .select('id, resource_type, resource_id, role, expires_at, revoked_at, max_uses, use_count')
      .eq('token_hash', tokenHash)
      .single();

    if (fetchError || !shareLink) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired share link',
      });
    }

    // Check if revoked
    if (shareLink.revoked_at) {
      return NextResponse.json({
        valid: false,
        error: 'This share link has been revoked',
      });
    }

    // Check expiration
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'This share link has expired',
      });
    }

    // Check max uses
    if (shareLink.max_uses && shareLink.use_count >= shareLink.max_uses) {
      return NextResponse.json({
        valid: false,
        error: 'This share link has reached its maximum uses',
      });
    }

    // Valid share link
    return NextResponse.json({
      valid: true,
      resource_type: shareLink.resource_type,
      resource_id: shareLink.resource_id,
      role: shareLink.role,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    console.error('Error in POST /api/share-links/validate:', error);
    return serverError();
  }
}
