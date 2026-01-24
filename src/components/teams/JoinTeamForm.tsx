'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
      return;
    }

    const formData = new FormData();
    formData.append('teamCode', code.trim().toUpperCase());

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
    <form onSubmit={handleFormSubmit} className="space-y-3">
      <div>
        <Label htmlFor="join-team-code" className="sr-only">Team Code</Label>
        <input
          id="join-team-code"
          name="teamCode"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter team code"
          className="w-full px-3.5 py-2.5 bg-white text-[#1a1612] border border-[#c4b8a5] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#a35d3a]/30 focus:border-[#a35d3a] placeholder-[#a39485] uppercase"
          maxLength={6}
          required
          disabled={isPending}
        />
        {formState.errors?.teamCode && (
          <p className="text-[#9b3c3c] text-sm mt-1.5">
            {formState.errors.teamCode.join(', ')}
          </p>
        )}
        {formState.message && (
          <p className={`${formState.success ? 'text-[#4a7c59]' : 'text-[#9b3c3c]'} text-sm mt-1.5`}>
            {formState.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="w-full py-2.5 px-4 bg-[#a35d3a] hover:bg-[#8a4e31] text-[#faf7f2] font-medium rounded text-sm disabled:opacity-50 transition-colors"
        disabled={isPending}
      >
        {isPending ? 'Joining...' : 'Join Team'}
      </button>
    </form>
  );
}
