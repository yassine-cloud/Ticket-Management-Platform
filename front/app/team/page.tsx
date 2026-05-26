"use client";
import React, { useState } from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { Mail, MoreVertical, Plus, X, Shield, Building } from 'lucide-react';

export default function TeamPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const team = [
    { name: 'John Doe', role: 'Platform Admin', email: 'john@example.com', initials: 'JD', bgColor: 'from-blue-500 to-blue-600 text-white' },
    { name: 'Jane Smith', role: 'Support', email: 'jane@example.com', initials: 'JS', bgColor: 'from-purple-500 to-purple-600 text-white' },
    { name: 'Bob Wilson', role: 'Developer', email: 'bob@example.com', initials: 'BW', bgColor: 'from-green-500 to-green-600 text-white' },
    { name: 'Alice Johnson', role: 'QA', email: 'alice@example.com', initials: 'AJ', bgColor: 'from-yellow-400 to-yellow-500 text-white' },
    { name: 'Michael Brown', role: 'Viewer', email: 'mike@example.com', initials: 'MB', bgColor: 'from-slate-500 to-slate-600 text-white' },
  ];

  return (
    <BaseLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Members</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your team members, permissions, and roles.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow border border-transparent text-sm font-semibold transition-all hover:shadow-md"
        >
          <Plus className="w-4 h-4 font-bold" /> Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {team.map((member, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col items-center text-center group">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 bg-gradient-to-tr shadow-inner ${member.bgColor}`}>
              {member.initials}
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{member.name}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 mt-1.5 mb-2">
              {member.role}
            </span>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
              <Mail className="w-4 h-4 text-gray-400" />
              {member.email}
            </div>
            
            <div className="w-full flex gap-3 mt-auto pt-4 border-t border-gray-100">
              <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-semibold border border-gray-200 transition-colors shadow-sm text-center">
                Profile
              </button>
              <button className="px-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm flex items-center justify-center">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <h2 className="text-xl font-bold text-gray-900">Invite Team Member</h2>
               <button 
                 onClick={() => setIsInviteModalOpen(false)} 
                 className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Addresses</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  placeholder="name@company.com, another@company.com"
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5"><Shield className="w-4 h-4 text-purple-500" /> Platform Role</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white cursor-pointer">
                    <option className="text-gray-900" value="developer">Developer</option>
                    <option className="text-gray-900" value="qa">QA</option>
                    <option className="text-gray-900" value="viewer">Viewer</option>
                    <option className="text-gray-900" value="manager">Manager</option>
                    <option className="text-gray-900" value="admin">Platform Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5"><Building className="w-4 h-4 text-blue-500" /> Project Assignment</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white cursor-pointer">
                    <option className="text-gray-900" value="all">All Projects (Global)</option>
                    <option className="text-gray-900" value="alpha">Project Alpha</option>
                    <option className="text-gray-900" value="beta">Project Beta</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Personalized Message (Optional)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white"
                  placeholder="Hey, join our workspace to collaborate on tickets!"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button 
                  onClick={() => setIsInviteModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setIsInviteModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
                >
                  Send Invitation
                </button>
            </div>
          </div>
        </div>
      )}
    </BaseLayout>
  );
}
