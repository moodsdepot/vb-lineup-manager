'use client';

import { CheckCircle, AlertCircle, Loader2, CloudOff } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

interface SavingIndicatorProps {
  status: SaveStatus;
  error?: string | null;
  onRetry?: () => void;
  onResolveConflict?: (useServer: boolean) => void;
}

export default function SavingIndicator({
  status,
  error,
  onRetry,
  onResolveConflict,
}: SavingIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  if (status === 'saving') {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (status === 'saved') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-400">
        <CheckCircle className="w-4 h-4" />
        <span>Saved</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span>{error || 'Save failed'}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="underline hover:no-underline ml-1"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (status === 'conflict') {
    return (
      <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-3 text-sm">
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <CloudOff className="w-4 h-4" />
          <span className="font-medium">Sync Conflict</span>
        </div>
        <p className="text-yellow-200/80 mb-3">
          {error || 'This lineup was modified elsewhere.'}
        </p>
        {onResolveConflict && (
          <div className="flex gap-2">
            <button
              onClick={() => onResolveConflict(true)}
              className="px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs"
            >
              Use Server Version
            </button>
            <button
              onClick={() => onResolveConflict(false)}
              className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
            >
              Keep My Changes
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
