import { createClient } from '@supabase/supabase-js'; // Use core client for RPC
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Database } from '@/types/supabase';

// Validation schema includes userId now
const JoinTeamSchema = z.object({
    teamCode: z.string()
                .trim()
                .length(6, "Team code must be 6 characters.")
                .regex(/^[A-Z0-9]+$/, "Invalid team code format."), 
    userId: z.string().uuid("Invalid User ID format."), 
});

export async function POST(request: Request) {
    console.log("API Route /api/teams/join received POST request (RPC Approach).");
    const cookieStore = cookies(); // Keep for context if function needs it

    // 1. Parse and Validate Request Body (Team Code AND UserId)
    let validatedData;
    try {
        const formData = await request.formData(); 
        const rawFormData = { 
            teamCode: formData.get('teamCode'), 
            userId: formData.get('userId') 
        };
        validatedData = JoinTeamSchema.parse(rawFormData); 
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, message: 'Invalid input.', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: 'Bad Request.' }, { status: 400 });
    }

    const { teamCode, userId } = validatedData; 
    console.log(`[API Route Join RPC] Processing request for user: ${userId} joining code: ${teamCode}`);

    // 2. Call the join_team Database Function
    try {
        // Create a basic client instance just for the RPC call
         const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
         const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
         if (!supabaseUrl || !supabaseAnonKey) throw new Error("Server config error");
         const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); 

        // Call the PostgreSQL function
        const { data: joinedTeamId, error: rpcError } = await supabase.rpc('join_team', {
            p_team_code: teamCode,
            p_user_id: userId 
        });

        if (rpcError) throw rpcError; // Throw database/function errors

        // Check if function returned a valid team ID (uuid string)
        if (typeof joinedTeamId !== 'string' || !joinedTeamId) {
            // This could happen if the function logic returned null explicitly 
            // or if the function raised an exception handled differently.
            // Based on current function logic, an invalid code throws exception handled below.
            console.warn(`[API Route Join RPC] Function returned null/invalid ID for code ${teamCode}. User might be member or code invalid.`);
             // We might need more specific error handling based on function behavior
             // For now, assume invalid code if ID is null after successful RPC.
             return NextResponse.json({ success: false, message: 'Invalid team code or already a member.' }, { status: 404 });
        }

        console.log(`API Route Join RPC: User ${userId} successfully processed for team ${joinedTeamId}.`);
        
        // 3. Return Success Response
        return NextResponse.json({ success: true, teamId: joinedTeamId }, { status: 200 }); 

    } catch (error: any) {
        console.error('API Route Error calling join_team RPC:', error);
         // Check for specific error codes raised by the function
         if (error.code === '22000' && error.message?.includes('Invalid team code provided')) {
            return NextResponse.json({ success: false, message: 'Invalid team code.' }, { status: 404 });
         }
        return NextResponse.json({ success: false, message: `Database error: ${error.message || 'Unknown error'}` }, { status: 500 });
    }
}
