'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { LineupState, LineupSlot } from '@/types/lineup-state';
import { DEFAULT_LINEUP_STATE } from '@/types/lineup-state';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

interface UseLineupStateOptions {
  lineupId: string | null;
  initialState?: LineupState;
  initialVersion?: number;
  canEdit?: boolean;
  autosaveDelay?: number;
}

interface UseLineupStateReturn {
  state: LineupState;
  version: number;
  saveStatus: SaveStatus;
  error: string | null;
  updateSlot: (slotIndex: number, update: Partial<LineupSlot>) => void;
  updateSlots: (slots: LineupSlot[]) => void;
  addDrawing: (drawing: NonNullable<LineupState['drawings']>[0]) => void;
  clearDrawings: () => void;
  updateMeta: (meta: Partial<NonNullable<LineupState['meta']>>) => void;
  updateRotation: (rotation: LineupState['rotation']) => void;
  save: () => Promise<void>;
  reload: () => Promise<void>;
  resolveConflict: (useServer: boolean) => Promise<void>;
}

export function useLineupState({
  lineupId,
  initialState = DEFAULT_LINEUP_STATE,
  initialVersion = 1,
  canEdit = true,
  autosaveDelay = 2000,
}: UseLineupStateOptions): UseLineupStateReturn {
  const [state, setState] = useState<LineupState>(initialState);
  const [version, setVersion] = useState<number>(initialVersion);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [serverState, setServerState] = useState<LineupState | null>(null);

  const pendingChanges = useRef(false);
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Use refs to avoid stale closures in callbacks
  const stateRef = useRef(state);
  const versionRef = useRef(version);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  // Clear autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, []);

  const performSave = useCallback(async () => {
    if (!lineupId || !canEdit) return;

    pendingChanges.current = false;
    setSaveStatus('saving');
    setError(null);

    try {
      const response = await fetch(`/api/lineups/${lineupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: stateRef.current,
          state_version: versionRef.current,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'VERSION_CONFLICT') {
          setSaveStatus('conflict');
          setServerState(data.current_state);
          setError('Someone else edited this lineup. Choose which version to keep.');
          return;
        }
        throw new Error(data.error || 'Failed to save');
      }

      setVersion(data.lineup.state_version);
      setSaveStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 2000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [lineupId, canEdit]);

  // Schedule autosave when state changes
  const scheduleAutosave = useCallback(() => {
    if (!canEdit || !lineupId) return;

    pendingChanges.current = true;

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = setTimeout(async () => {
      if (pendingChanges.current) {
        await performSave();
      }
    }, autosaveDelay);
  }, [canEdit, lineupId, autosaveDelay, performSave]);

  const save = useCallback(async () => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    await performSave();
  }, [performSave]);

  const reload = useCallback(async () => {
    if (!lineupId) return;

    try {
      const response = await fetch(`/api/lineups/${lineupId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reload');
      }

      setState(data.lineup.state);
      setVersion(data.lineup.state_version);
      setSaveStatus('idle');
      setError(null);
      setServerState(null);
    } catch (err) {
      console.error('Reload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reload');
    }
  }, [lineupId]);

  const resolveConflict = useCallback(
    async (useServer: boolean) => {
      if (useServer && serverState) {
        setState(serverState);
      }
      setServerState(null);
      setSaveStatus('idle');
      setError(null);

      // If keeping local changes, save with new version
      if (!useServer) {
        await reload(); // Get latest version first
        scheduleAutosave(); // Then schedule save of local state
      }
    },
    [serverState, reload, scheduleAutosave]
  );

  const updateSlot = useCallback(
    (slotIndex: number, update: Partial<LineupSlot>) => {
      if (!canEdit) return;

      setState((prev) => ({
        ...prev,
        slots: prev.slots.map((slot, i) =>
          i === slotIndex ? { ...slot, ...update } : slot
        ),
      }));
      scheduleAutosave();
    },
    [canEdit, scheduleAutosave]
  );

  const updateSlots = useCallback(
    (slots: LineupSlot[]) => {
      if (!canEdit) return;

      setState((prev) => ({
        ...prev,
        slots,
      }));
      scheduleAutosave();
    },
    [canEdit, scheduleAutosave]
  );

  const addDrawing = useCallback(
    (drawing: NonNullable<LineupState['drawings']>[0]) => {
      if (!canEdit) return;

      setState((prev) => ({
        ...prev,
        drawings: [...(prev.drawings || []), drawing],
      }));
      scheduleAutosave();
    },
    [canEdit, scheduleAutosave]
  );

  const clearDrawings = useCallback(() => {
    if (!canEdit) return;

    setState((prev) => ({
      ...prev,
      drawings: [],
    }));
    scheduleAutosave();
  }, [canEdit, scheduleAutosave]);

  const updateMeta = useCallback(
    (meta: Partial<NonNullable<LineupState['meta']>>) => {
      if (!canEdit) return;

      setState((prev) => ({
        ...prev,
        meta: { ...prev.meta, ...meta },
      }));
      scheduleAutosave();
    },
    [canEdit, scheduleAutosave]
  );

  const updateRotation = useCallback(
    (rotation: LineupState['rotation']) => {
      if (!canEdit) return;

      setState((prev) => ({
        ...prev,
        rotation,
      }));
      scheduleAutosave();
    },
    [canEdit, scheduleAutosave]
  );

  return {
    state,
    version,
    saveStatus,
    error,
    updateSlot,
    updateSlots,
    addDrawing,
    clearDrawings,
    updateMeta,
    updateRotation,
    save,
    reload,
    resolveConflict,
  };
}
