import type { Metadata } from "next";
import NotebooksClientLayout from "./NotebooksClientLayout";

export const metadata: Metadata = {
  title: "Notebooks",
};

export default function NotebooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NotebooksClientLayout>{children}</NotebooksClientLayout>;
}
