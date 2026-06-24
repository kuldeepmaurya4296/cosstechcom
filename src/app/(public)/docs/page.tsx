import React from "react";
import { docsSections } from "@/data/docs-content";
import { notFound } from "next/navigation";

export const metadata = {
  title: "System Documentation — Raja Boot House",
  description:
    "Comprehensive system manual, customer checkout guides, and administrator guides for Raja Boot House.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "System Documentation — Raja Boot House",
    description:
      "Comprehensive system manual, customer checkout guides, and administrator guides for Raja Boot House.",
    type: "website",
  },
};

export default function DocsIndexPage() {
  const introSection = docsSections.find((s) => s.id === "introduction");

  if (!introSection) {
    notFound();
  }

  return (
    <article className="prose prose-sm md:prose max-w-none dark:prose-invert">
      {introSection.content}
    </article>
  );
}
