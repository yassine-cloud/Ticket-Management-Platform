import React from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import Link from 'next/link';
import { ProjectKanbanBoard } from '@/components/projects/ProjectKanbanBoard';

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <BaseLayout>
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-blue-600 hover:underline mb-2 inline-block">&larr; Back to Projects</Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Project {id}</h1>
          <Link
            href={`/messages?projectId=${id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Open project messaging
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <ProjectKanbanBoard projectId={id} />
    </BaseLayout>
  );
}
