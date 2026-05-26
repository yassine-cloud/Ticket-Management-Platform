import React from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import Link from 'next/link';

export default function TicketDetailsPage({ params }: { params: { id: string } }) {
  return (
    <BaseLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/tickets" className="text-sm text-blue-600 hover:underline mb-2 inline-block">&larr; Back to Tickets</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">TKT-{params.id}00: Setup authentication</h1>
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
              In Progress
            </span>
          </div>
        </div>
        <div className="space-x-3">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow-sm text-sm font-medium border border-gray-300">
            Edit
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm text-sm font-medium">
            Resolve
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>
            <div className="prose text-sm text-gray-600">
              <p>We need to implement the base authentication layer for the application utilizing our new NestJS backend. We're implementing JWT strategies with refresh tokens support.</p>
              <ul>
                <li>Set up login layout</li>
                <li>Redux or Context to hold auth state</li>
                <li>Connect to /api/auth/login</li>
              </ul>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Activity & Comments</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex-shrink-0"></div>
                <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">Jane Smith</span>
                    <span className="text-xs text-gray-400">1 hr ago</span>
                  </div>
                  <p className="text-sm text-gray-600">I've started working on the login form layout.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Assignee</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-6 w-6 rounded-full bg-gray-200"></div>
                  <span className="text-sm">John Doe</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Reporter</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-6 w-6 rounded-full bg-gray-200"></div>
                  <span className="text-sm">Bob Wilson</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Priority</p>
                <span className="text-sm text-red-600 font-medium mt-1 block">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
