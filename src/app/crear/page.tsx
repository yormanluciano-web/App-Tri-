import type { Metadata } from "next";
import { SetupWizard } from "@/features/setup/SetupWizard";

export const metadata: Metadata = { title: "Nueva sesión" };

export default function Page() {
  return <SetupWizard />;
}
