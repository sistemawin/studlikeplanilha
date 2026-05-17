import { create } from "zustand";

type TimerState = {
  running: boolean;
  seconds: number;
  focusOpen: boolean;
  defaultSubjectId: string | undefined;
  defaultTopicId: string | undefined;
};

type TimerActions = {
  /** Opens the focus view and starts the timer. */
  open: (defaultSubjectId?: string, defaultTopicId?: string) => void;
  /** Closes the focus overlay only — timer keeps running in background. */
  closeView: () => void;
  /** Stops timer and hides overlay (used after registering a session). */
  finish: () => void;
  /** Stops timer and resets seconds to zero. */
  reset: () => void;
  /** Sets running explicitly (for play/pause inside FocusTimer). */
  setRunning: (running: boolean) => void;
  /** Increments seconds by 1. Called by setInterval in page.tsx. */
  increment: () => void;
  /** Sets seconds to a specific value (for reset / manual restore). */
  setSeconds: (seconds: number) => void;
};

export type TimerStore = TimerState & TimerActions;

export const useTimerStore = create<TimerStore>((set) => ({
  running: false,
  seconds: 0,
  focusOpen: false,
  defaultSubjectId: undefined,
  defaultTopicId: undefined,

  open: (defaultSubjectId, defaultTopicId) =>
    set({ focusOpen: true, running: true, defaultSubjectId, defaultTopicId }),

  closeView: () => set({ focusOpen: false }),

  finish: () => set({ focusOpen: false, running: false }),

  reset: () => set({ running: false, seconds: 0 }),

  setRunning: (running) => set({ running }),

  increment: () => set((s) => ({ seconds: s.seconds + 1 })),

  setSeconds: (seconds) => set({ seconds }),
}));
