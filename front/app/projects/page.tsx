"use client";
import React, { useState } from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import Link from 'next/link';
import { Plus, FolderKanban, MoreVertical, LayoutGrid, X } from 'lucide-react';

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <BaseLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all active workspaces and their specific tickets.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow border border-transparent text-sm font-semibold transition-all hover:shadow-md"
        >
          <Plus className="w-4 h-4 font-bold" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5].map((id) => (
          <Link href={`/projects/${id}`} key={id} className="block group">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform duration-300">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Project Alpha {id}</h2>
              <p className="text-sm text-gray-500 mb-6 flex-grow">A sample project to demonstrate structure, containing various modules and feature tasks.</p>
              
              <div className="mt-auto">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-gray-700">Progress</span>
                  <span className="text-gray-900">45%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">JD</div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-purple-500 flex items-center justify-center text-[10px] text-white font-bold">SM</div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] text-gray-600 font-bold">+3</div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 px-3 py-1 bg-gray-100 rounded-full">12 Open</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
               <button 
                 onClick={() => setIsModalOpen(false)} 
                 className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Project Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white"
                  placeholder="e.g. Website Redesign"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Project Key / Prefix</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white uppercase"
                  placeholder="e.g. WEB"
                />
                <p className="text-xs text-gray-500 mt-1">This will be used as a prefix for all tickets (e.g. WEB-102).</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white"
                  placeholder="Briefly describe what this project is about..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Project Lead</label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white cursor-pointer">
                  <option className="text-gray-900">John Doe (You)</option>
                  <option className="text-gray-900">Jane Smith</option>
                  <option className="text-gray-900">Bob Wilson</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
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
                  Create Project
                </button>
            </div>
          </div>
        </div>
      )}
    </BaseLayout>
  );
}
