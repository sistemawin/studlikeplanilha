import type { Review } from "@/types";

export type ReviewGroup = {
  dateIso: string;
  reviews: Review[];
};

export type ReviewFilter = "all" | string; // "all" or a subject ID

export type RescheduleOption = 1 | 3 | 7 | 14;
