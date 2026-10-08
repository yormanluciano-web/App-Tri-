import type { Metadata } from "next";
import { AdminApp } from "@/features/admin/AdminApp";

export const metadata: Metadata = { title: "Administración" };

export default function Page() {
  return <AdminApp />;
}
