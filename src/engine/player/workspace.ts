import { create } from "zustand";
import { parseCustom } from "@/algorithms/custom";

/**
 * Which dataset the workspace is showing — a curated one, or a custom input.
 * Shared by the dataset pills, the custom-input form, and the AI tutor's tools,
 * so all three drive one source of truth. ProblemWorkspace derives the trace from it.
 */
interface WorkspaceState {
  exampleId: string;
  datasetId: string; // a curated dataset id, or "custom"
  customValues: (number | string)[] | null;
  customArg: number | null;
  customError: string | null;

  init: (exampleId: string, datasetId: string) => void;
  selectDataset: (id: string) => void;
  applyCustom: (rawValues: string, rawArg?: string) => { ok: boolean; error?: string };
  clearError: () => void;
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  exampleId: "",
  datasetId: "default",
  customValues: null,
  customArg: null,
  customError: null,

  init: (exampleId, datasetId) =>
    set({ exampleId, datasetId, customValues: null, customArg: null, customError: null }),

  selectDataset: (id) =>
    set({ datasetId: id, customValues: null, customArg: null, customError: null }),

  applyCustom: (rawValues, rawArg = "") => {
    const res = parseCustom(get().exampleId, rawValues, rawArg);
    if (!res.ok) {
      set({ customError: res.error });
      return { ok: false, error: res.error };
    }
    set({
      datasetId: "custom",
      customValues: res.input.values,
      customArg: res.input.arg ?? null,
      customError: null,
    });
    return { ok: true };
  },

  clearError: () => set({ customError: null }),
}));
