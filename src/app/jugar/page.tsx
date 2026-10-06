import type { Metadata } from "next";
import { Table } from "@/features/session/Table";

export const metadata: Metadata = { title: "Jugar" };

export default function Page() {
  return <Table />;
}
