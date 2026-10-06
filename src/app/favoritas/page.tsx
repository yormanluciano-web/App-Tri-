import type { Metadata } from "next";
import { Favorites } from "@/features/session/Favorites";

export const metadata: Metadata = { title: "Favoritas" };

export default function Page() {
  return <Favorites />;
}
