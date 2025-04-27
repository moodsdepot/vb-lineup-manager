'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JoinTeamFormProps {
  onInitiateSubmit: () => boolean;
  userId: string | null | undefined;
}

interface FormState {
  success: boolean;
  message: string | null;
  alreadyMember?: boolean;
  errors?: {
    teamCode?: string[] | undefined;
  } | null;
}

const initialState: FormState = { success: false, message: null, errors: null };

export default function JoinTeamForm({ onInitiateSubmit, userId }: JoinTeamFormProps) {
  const [code, setCode] = useState('');
  const [formState, setFormState] = useState<FormState>(initialState);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState(initialState);

    const canProceed = onInitiateSubmit();
    if (!canProceed || !userId) {
      setFormState({ success: false, message: "User not available. Please log in.", errors: null });
      onInitiateSubmit();
      return;
    }

    const formData = new FormData();
    formData.append('teamCode', code.trim().toUpperCase());
    formData.append('userId', userId);

    startTransition(async () => {
      try {
        const response = await fetch('/api/teams/join', {
          method: 'POST',
          body: formData,
        });

        const result: FormState & { teamId?: string } = await response.json();

        if (!response.ok || !result.success) {
          console.error("API Join Error:", result.message, result.errors);
          setFormState({
            success: false,
            message: result.message || 'Failed to join team.',
            errors: result.errors || null
          });
        } else {
          console.log("API Join Success:", result.message || "Joined successfully", result.teamId);
          if (result.teamId) {
            router.push(`/court/${result.teamId}`);
          } else {
            setFormState({ success: true, message: 'Joined team, but redirect failed.', errors: null });
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        setFormState({ success: false, message: 'Network error. Please try again.', errors: null });
      }
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <Label htmlFor="join-team-code" className="sr-only">Team Code</Label>
        <Input
          id="join-team-code"
          name="teamCode"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter team code"
          className="w-full px-4 py-3 bg-blue-800/30 text-white border border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/40"
          maxLength={6}
          required
          disabled={isPending}
        />
        {formState.errors?.teamCode && (
          <p className="text-blue-300 text-sm mt-1">
            {formState.errors.teamCode.join(', ')}
          </p>
        )}
        {formState.message && (
          <p className={`${formState.success ? 'text-green-400' : 'text-blue-300'} text-sm mt-1`}>
            {formState.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-satoshi font-bold rounded-md disabled:opacity-50 transition-all duration-300"
        disabled={isPending}
      >
        {isPending ? 'Joining...' : 'Join Team'}
      </Button>
    </form>
  );
}
