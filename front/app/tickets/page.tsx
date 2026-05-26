"use client";
import React, { useState } from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import Link from 'next/link';
import { Filter, Search, Plus, MoreHorizontal, X, AlertCircle } from 'lucide-react';

export default function TicketsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <BaseLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">All Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">View, filter, and manage all cross-project issues.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow border border-transparent text-sm font-semibold transition-all hover:shadow-md"
        >
          <Plus className="w-4 h-4 font-bold" /> Create Ticket
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ID, title, assignee..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white"
            />
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" /> Filters
            </button>
            <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option className="text-gray-900">All Statuses</option>
              <option className="text-gray-900">Open</option>
              <option className="text-gray-900">In Progress</option>
              <option className="text-gray-900">Resolved</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket Details</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Assignee</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Priority</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                <th scope="col" className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {[1, 2, 3, 4, 5, 6, 7].map((id) => (
                <tr key={id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <Link href={`/tickets/${id}`} className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        [TKT-{id}00] Setup authentication for frontend
                      </Link>
                      <span className="text-xs text-gray-500 mt-1 font-medium">Project Alpha</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                      In Progress
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-2">JD</div>
                      <span className="text-sm text-gray-700 font-medium">John Doe</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <span className={`text-sm font-bold flex items-center gap-1.5 ${id % 2 === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${id % 2 === 0 ? 'bg-red-600' : 'bg-orange-500'}`}></span>
                      {id % 2 === 0 ? 'High' : 'Medium'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell text-sm text-gray-500 font-medium">
                    2 days ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between sm:px-6">
          <p className="text-sm text-gray-700">
            Showing <span className="font-semibold">1</span> to <span className="font-semibold">7</span> of <span className="font-semibold">42</span> results
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
               <h2 className="text-xl font-bold text-gray-900">Create New Ticket</h2>
               <button 
                 onClick={() => setIsModalOpen(false)} 
                 className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Project</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white cursor-pointer">
                    <option className="text-gray-900">Project Alpha</option>
                    <option className="text-gray-900">Project Beta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Issue Type</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white cursor-pointer">
                    <option className="text-gray-900">Task</option>
                    <option className="text-gray-900">Bug</option>
                    <option className="text-gray-900">Story</option>
                    <option className="text-gray-900">Epic</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white"
                  placeholder="Summarize the request/issue"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white"
                  placeholder="Provide all details and context..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white cursor-pointer">
                    <option value="low" className="text-gray-900">Low</option>
                    <option value="medium" className="text-gray-900">Medium</option>
                    <option value="high" className="text-gray-900">High</option>
                    <option value="critical" className="text-gray-900">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Assignee</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white cursor-pointer">
                    <option value="unassigned" className="text-gray-900">Unassigned</option>
                    <option value="1" className="text-gray-900">John Doe (You)</option>
                    <option value="2" className="text-gray-900">Jane Smith</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
                >
                  Create Ticket
                </button>
            </div>
          </div>
        </div>
      )}
    </BaseLayout>
  );
}
