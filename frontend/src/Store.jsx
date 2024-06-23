import { create } from "zustand";

export const useStore = create((set) => ({
  currClass: {
    name: "CIS-1962",
    semester: "Fall 2024",
  },
  setCurrClass: (currClass) => set({ currClass }),
  boredom: [],
  addBoredom: (b) => set((state) => ({ boredom: [...state.boredom, b] })),
}));
