import React from "react";
import { docsSections } from "@/data/docs-content";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = docsSections.find((s) => s.id === slug);

  if (!section) {
    return {
      title: "Page Not Found — CosstechCom Docs",
    };
  }

  return {
    title: `${section.title} — CosstechCom Docs`,
    description: section.description,
    alternates: {
      canonical: `/docs/${slug}`,
    },
    openGraph: {
      title: `${section.title} — CosstechCom Docs`,
      description: section.description,
      type: "article",
    },
  };
}

export default async function DocsSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const section = docsSections.find((s) => s.id === slug);

  if (!section) {
    notFound();
  }

  return (
    <article className="prose prose-sm md:prose max-w-none dark:prose-invert">
      {section.content}
    </article>
  );
}

// Pre-generate routes for static build optimization
export async function generateStaticParams() {
  return docsSections.map((s) => ({
    slug: s.id,
  }));
}
