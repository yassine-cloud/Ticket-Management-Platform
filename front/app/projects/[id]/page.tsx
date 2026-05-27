import React from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import Link from 'next/link';

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  return (
    <BaseLayout>
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-blue-600 hover:underline mb-2 inline-block">&larr; Back to Projects</Link>
        <h1 className="text-2xl font-bold text-gray-900">Project {params.id}</h1>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Board / Kanban View</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columns */}
          {['To Do', 'In Progress', 'Done'].map(status => (
            <div key={status} className="bg-gray-50 p-4 rounded-md border border-gray-200 min-h-[400px]">
              <h3 className="font-semibold text-gray-700 mb-4">{status}</h3>
              <div className="space-y-3">
                {[1, 2].map(ticket => (
                  <div key={ticket} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-800">TKT-{ticket}00</p>
                    <p className="text-xs text-gray-500 mt-1">Sample ticket description for {status}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseLayout>
  );
}
