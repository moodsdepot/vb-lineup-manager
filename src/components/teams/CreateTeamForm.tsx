'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      onInitiateSubmit();
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.append('userId', userId);

    startTransition(async () => {
      try {
        const response = await fetch('/api/teams/create', {
          method: 'POST',
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="create-team-name" className="sr-only">Team Name</Label>
        <Input
          id="create-team-name"
          type="text"
          name="teamName"
          required
          placeholder="Enter team name"
          className="w-full px-4 py-3 bg-blue-800/30 text-white border border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent placeholder-white/40"
          maxLength={50}
          disabled={isPending}
        />
        {formState.errors?.teamName && (
          <p className="text-violet-300 text-sm mt-1">
            {formState.errors.teamName.join(', ')}
          </p>
        )}
        {formState.message && !formState.success && (
          <p className="text-violet-300 text-sm mt-1">{formState.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-violet-400 hover:from-violet-700 hover:to-violet-500 text-white font-satoshi font-bold rounded-md disabled:opacity-50 transition-all duration-300"
        disabled={isPending}
      >
        {isPending ? 'Creating...' : 'Create Team'}
      </Button>
    </form>
  );
}
