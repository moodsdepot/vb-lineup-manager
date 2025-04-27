import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Database } from '@/types/supabase';

// Input schema validation
const CreateTeamSchema = z.object({
    teamName: z.string().trim().min(1, "Team name cannot be empty.").max(50, "Team name too long (max 50 chars)."),
    userId: z.string().uuid("Invalid User ID format."),
});

// Helper function (duplicate from action, consider moving to shared lib if used elsewhere)
function generateTeamCode(length = 6): string {
    const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export async function POST(request: Request) {
    console.log("API Route /api/teams/create received POST request (Client Session Approach).");
    const cookieStore = cookies();

    // 1. Parse and Validate Request Body (including userId)
    let validatedData;
    let userIdFromForm: string | null = null; 
    try {
        const formData = await request.formData(); 
        userIdFromForm = formData.get('userId') as string | null; // Get userId from form data
        const rawFormData = { 
            teamName: formData.get('teamName'),
            userId: userIdFromForm 
        };
        // Validate teamName AND userId
        validatedData = CreateTeamSchema.parse(rawFormData); 
    } catch (error) {
        if (error instanceof z.ZodError) {
             console.error("Validation Error:", error.flatten().fieldErrors);
             return NextResponse.json({ success: false, message: 'Invalid input.', errors: error.flatten().fieldErrors }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: 'Bad Request.' }, { status: 400 });
    }

    // We now trust the userId passed from the client form
    // because the form submission was gated by a client-side auth check
    const { teamName, userId } = validatedData; 
    console.log(`[API Route] Processing request for user: ${userId}`);

    const teamCode = generateTeamCode(); 

    // 2. Call Database Function (RPC)
    try {
        // Create a basic client instance *just for the RPC call*
        // It doesn't need auth context if the PG function is secure/uses passed userId
         const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
         const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
         if (!supabaseUrl || !supabaseAnonKey) throw new Error("Server config error");
         const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseAnonKey); // Use basic client

        // Call the RPC function
        const { data: newTeamId, error: rpcError } = await supabaseAdmin.rpc('create_team_and_add_owner', {
            p_team_name: teamName,
            p_team_code: teamCode,
            p_user_id: userId 
        });

        if (rpcError) throw rpcError;

        // Check if the returned data is a non-empty string (should be the UUID)
        if (typeof newTeamId !== 'string' || !newTeamId) { 
            console.error("RPC Error: Did not return a valid team ID string. Received:", newTeamId);
            throw new Error('Team creation RPC did not return a valid team ID.');
        }

        console.log(`API Route: Team created successfully with ID: ${newTeamId}`);
        
        // 3. Return Success Response
        return NextResponse.json({ success: true, teamId: newTeamId }, { status: 201 });

    } catch (error: any) {
        console.error('API Route Error creating team:', error);
        if (error.code === '23505' && error.message.includes('teams_code_key')) {
            return NextResponse.json({ success: false, message: 'Failed to generate a unique team code. Please try again.' }, { status: 500 });
        }
        return NextResponse.json({ success: false, message: `Database error: ${error.message || 'Unknown error'}` }, { status: 500 });
    }
}
