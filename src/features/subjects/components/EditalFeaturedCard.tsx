"use client";

import type { ReadyEdital } from "@/lib/readyEditals";
import { EditalCard } from "./EditalCard";

type Props = {
  edital: ReadyEdital;
  onImport: (edital: ReadyEdital) => void | Promise<void>;
  index?: number;
};

export function EditalFeaturedCard({ edital, onImport, index = 0 }: Props) {
  return <EditalCard edital={edital} onImport={onImport} index={index} featured />;
}
