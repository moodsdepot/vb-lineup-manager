'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface CreateTeamFormProps {
  onInitiateSubmit: () => boolean;
  userId: string | null | undefined;
}

interface FormState {
  success: boolean;
  message: string | null;
  errors?: {
    teamName?: string[] | undefined;
  } | null;
}

const initialState: FormState = { success: false, message: null, errors: null };

export default function CreateTeamForm({ onInitiateSubmit, userId }: CreateTeamFormProps) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormState(initialState);

    const canProceed = onInitiateSubmit();
    if (!canProceed || !userId) {
      setFormState({ success: false, message: "User not available. Please log in.", errors: null });
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch('/api/teams/create', {
          method: 'POST',
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          body: formData,
        });

        const result: FormState & { teamId?: string } = await response.json();

        if (!response.ok || !result.success) {
          console.error("API Error:", result.message, result.errors);
          setFormState({
            success: false,
            message: result.message || 'An unexpected error occurred.',
            errors: result.errors || null
          });
        } else {
          console.log("API Success: Team created", result.teamId);
          if(result.teamId) {
            router.push(`/court/${result.teamId}`);
          } else {
            setFormState({ success: true, message: 'Team created, but redirect failed.', errors: null });
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        setFormState({ success: false, message: 'Network error. Please try again.', errors: null });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="create-team-name" className="sr-only">Team Name</Label>
        <input
          id="create-team-name"
          type="text"
          name="teamName"
          required
          placeholder="Enter team name"
          className="w-full px-3.5 py-2.5 bg-white text-[#1a1612] border border-[#c4b8a5] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#a35d3a]/30 focus:border-[#a35d3a] placeholder-[#a39485]"
          maxLength={50}
          disabled={isPending}
        />
        {formState.errors?.teamName && (
          <p className="text-[#9b3c3c] text-sm mt-1.5">
            {formState.errors.teamName.join(', ')}
          </p>
        )}
        {formState.message && !formState.success && (
          <p className="text-[#9b3c3c] text-sm mt-1.5">{formState.message}</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full py-2.5 px-4 bg-[#a35d3a] hover:bg-[#8a4e31] text-[#faf7f2] font-medium rounded text-sm disabled:opacity-50 transition-colors"
        disabled={isPending}
      >
        {isPending ? 'Creating...' : 'Create Team'}
      </button>
    </form>
  );
}
