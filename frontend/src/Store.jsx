import { create } from "zustand";

export const useStore = create((set) => ({
  currClass: {
    name: "CIS-1962",
    semester: "Fall 2024",
  },
  setCurrClass: (currClass) => set({ currClass }),
  boredom: [],
  addBoredom: (b) => set((state) => ({ boredom: [...state.boredom, b] })),
  pdf: null,
  setPdf: (pdf) => set({ pdf }),

  timesLocked: 0,
  addTimesLocked: () => set((state) => ({timesLocked: state.timesLocked+1}))
}));
