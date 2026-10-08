import type { Metadata } from "next";
import { SpotifyCallback } from "@/music/callback";

export const metadata: Metadata = { title: "Conectando Spotify" };

export default function Page() {
  return <SpotifyCallback />;
}
