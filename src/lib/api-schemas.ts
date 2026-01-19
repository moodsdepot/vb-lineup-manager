import { z } from 'zod';

// ============================================
// Athletes
// ============================================

export const AthleteCreateSchema = z.object({
  jersey_number: z.string().min(1).max(10),
  display_name: z.string().max(100).optional(),
  position: z.enum(['OH', 'MB', 'S', 'OPP', 'L', 'DS']).optional(),
  is_active: z.boolean().optional().default(true),
});

export const AthleteUpdateSchema = z.object({
  jersey_number: z.string().min(1).max(10).optional(),
  display_name: z.string().max(100).nullable().optional(),
  position: z.enum(['OH', 'MB', 'S', 'OPP', 'L', 'DS']).nullable().optional(),
  is_active: z.boolean().optional(),
});

// ============================================
// Lineups
// ============================================

const LineupSlotSchema = z.object({
  slot: z.number().int().min(1),
  athlete_id: z.string().uuid().nullable(),
  label: z.string().max(50).optional(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

const LineupRotationSchema = z.object({
  order: z.array(z.string().uuid()),
  current: z.number().int().min(0),
});

const LineupDrawingPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const LineupDrawingSchema = z.object({
  id: z.string(),
  color: z.string(),
  width: z.number().optional(),
  points: z.array(LineupDrawingPointSchema),
});

const LineupMetaSchema = z.object({
  formation: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
});

export const LineupStateSchema = z.object({
  slots: z.array(LineupSlotSchema),
  rotation: LineupRotationSchema.optional(),
  drawings: z.array(LineupDrawingSchema).optional(),
  meta: LineupMetaSchema.optional(),
});

export const LineupCreateSchema = z.object({
  name: z.string().min(1).max(100).optional().default('Untitled Lineup'),
  state: LineupStateSchema.optional(),
});

export const LineupUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  state: LineupStateSchema.optional(),
  state_version: z.number().int().min(1),
});

// ============================================
// Share Links
// ============================================

export const ShareLinkCreateSchema = z.object({
  resource_type: z.enum(['team', 'lineup']),
  resource_id: z.string().uuid(),
  role: z.enum(['editor', 'viewer']).optional().default('viewer'),
  expires_at: z.string().datetime().optional(),
  max_uses: z.number().int().min(1).optional(),
});

export const ShareLinkValidateSchema = z.object({
  token: z.string().min(1),
});

// ============================================
// Teams
// ============================================

export const TeamCreateSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  sport_type: z.string().max(50).optional().default('volleyball'),
});

export const TeamUpdateSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  sport_type: z.string().max(50).optional(),
  archived_at: z.string().datetime().nullable().optional(),
});

// ============================================
// Team Members
// ============================================

export const TeamMemberCreateSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'editor', 'viewer']).optional().default('viewer'),
});

export const TeamMemberUpdateSchema = z.object({
  role: z.enum(['owner', 'editor', 'viewer']),
});
