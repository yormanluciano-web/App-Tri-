import type { Metadata } from "next";
import { Help } from "@/features/session/Help";

export const metadata: Metadata = { title: "Cómo funciona" };

export default function Page() {
  return <Help />;
}
