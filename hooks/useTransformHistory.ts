"use client";

import { useCallback, useEffect, useReducer } from "react";
import type { BundleTransforms } from "@/lib/bundle-editor";

function cloneTransforms(t: BundleTransforms): BundleTransforms {
  return {
    productA: { ...t.productA },
    productB: { ...t.productB },
    productC: { ...t.productC },
    badge: { ...t.badge },
  };
}

function transformsEqual(a: BundleTransforms, b: BundleTransforms): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const MAX_HISTORY = 50;

type State = {
  entries: BundleTransforms[];
  index: number;
  gestureBase: BundleTransforms | null;
};

type Action =
  | {
      type: "set";
      payload:
        | BundleTransforms
        | ((p: BundleTransforms) => BundleTransforms);
    }
  | { type: "begin_gesture" }
  | { type: "commit" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; payload: BundleTransforms };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set": {
      const current = state.entries[state.index];
      const next =
        typeof action.payload === "function"
          ? action.payload(cloneTransforms(current))
          : cloneTransforms(action.payload);
      const entries = [...state.entries];
      entries[state.index] = next;
      return { ...state, entries };
    }
    case "begin_gesture":
      return {
        ...state,
        gestureBase: cloneTransforms(state.entries[state.index]),
      };
    case "commit": {
      const current = state.entries[state.index];
      const base = state.gestureBase;

      if (base && transformsEqual(base, current)) {
        return {
          ...state,
          gestureBase: null,
          entries: state.entries.slice(0, state.index + 1),
        };
      }

      const branch = state.entries.slice(0, state.index + 1);
      const entries = [...branch, cloneTransforms(current)];
      const trimmed =
        entries.length > MAX_HISTORY ? entries.slice(-MAX_HISTORY) : entries;

      return {
        entries: trimmed,
        index: trimmed.length - 1,
        gestureBase: null,
      };
    }
    case "undo": {
      if (state.index <= 0) return state;
      return { ...state, index: state.index - 1, gestureBase: null };
    }
    case "redo": {
      if (state.index >= state.entries.length - 1) return state;
      return { ...state, index: state.index + 1, gestureBase: null };
    }
    case "reset":
      return {
        entries: [cloneTransforms(action.payload)],
        index: 0,
        gestureBase: null,
      };
    default:
      return state;
  }
}

export function useTransformHistory(initial: BundleTransforms) {
  const [state, dispatch] = useReducer(reducer, {
    entries: [cloneTransforms(initial)],
    index: 0,
    gestureBase: null,
  });

  const transforms = state.entries[state.index];

  const setTransforms = useCallback(
    (
      update:
        | BundleTransforms
        | ((prev: BundleTransforms) => BundleTransforms),
    ) => {
      dispatch({ type: "set", payload: update });
    },
    [],
  );

  const beginGesture = useCallback(() => {
    dispatch({ type: "begin_gesture" });
  }, []);

  const commitTransforms = useCallback(() => {
    dispatch({ type: "commit" });
  }, []);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  const resetHistory = useCallback((next: BundleTransforms) => {
    dispatch({ type: "reset", payload: next });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        dispatch({ type: "undo" });
      } else if (event.key === "z" && event.shiftKey) {
        event.preventDefault();
        dispatch({ type: "redo" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return {
    transforms,
    setTransforms,
    beginGesture,
    commitTransforms,
    undo,
    redo,
    canUndo: state.index > 0,
    canRedo: state.index < state.entries.length - 1,
    resetHistory,
  };
}
