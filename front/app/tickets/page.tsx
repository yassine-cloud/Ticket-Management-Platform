"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import Link from 'next/link';
import { Filter, Search, Plus, MoreHorizontal, X, Clock, AlertCircle } from 'lucide-react';
import { formatTicketStatusLabel, ticketsAPI, Ticket, Status } from '@/lib/api/tickets.api';
import { projectsAPI, Project } from '@/lib/api/projects.api';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [allStatuses, setAllStatuses] = useState<Status[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatusId, setFilterStatusId] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState<any>('');
  const [priority, setPriority] = useState('MEDIUM');
  const [projectId, setProjectId] = useState('');

  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTickets = async (p: number) => {
    setLoading(true);
    try {
      const res = await ticketsAPI.getTickets(undefined, p, limit, debouncedSearch, filterStatusId, filterPriority);
      if (res.data) {
        setTickets(res.data);
        setTotal(res.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const [projRes] = await Promise.all([
        projectsAPI.getProjects()
      ]);
      if (projRes.data) {
        setProjects(projRes.data);
        if (projRes.data.length > 0) setProjectId(projRes.data[0].id);
      }
      ticketsAPI.getStatuses().then(res => {
        if (res.data) {
          setAllStatuses(res.data);
        }
      });
    }
    init();
  }, []);

  const uniqueStatusNames = useMemo(() => {
    const names = new Set<string>();
    allStatuses.forEach(s => {
      if (s.name) names.add(s.name);
    });
    return Array.from(names);
  }, [allStatuses]);

  useEffect(() => {
    if (projectId) {
      ticketsAPI.getStatuses(projectId).then(res => {
        if (res.data) {
          setStatuses(res.data);
          if (res.data.length > 0 && !editingTicket) setStatusId(res.data[0].id as any);
        }
      });
    }
  }, [projectId, editingTicket]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchTickets(page);
  }, [page, debouncedSearch, filterStatusId, filterPriority]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleOpenCreate = () => {
    setEditingTicket(null);
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    if (projects.length > 0) setProjectId(projects[0].id);
    if (statuses.length > 0) setStatusId(statuses[0].id);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setTitle(ticket.title);
    setDescription(ticket.description || '');
    setPriority(ticket.priority);
    setProjectId(ticket.projectId);
    setStatusId(ticket.status as any);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !statusId || !projectId) return;
    const selectedStatus = statusId as any;

    if (editingTicket) {
      // Edit workflow
      const input = {
        title,
        description,
        status: selectedStatus,
        priority: priority.toUpperCase()
      } as any;
      const res = await ticketsAPI.updateTicket(editingTicket.id, input);
      if (res.data) {
        toast({ title: 'Ticket Updated', description: 'Your changes have been saved.', type: 'success' });
        setTickets(prev => prev.map(t => t.id === editingTicket.id ? res.data! : t));
        setIsModalOpen(false);
      } else {
        toast({ title: 'Update Failed', description: res.error, type: 'error' });
      }
    } else {
      // Create workflow
      const input = {
        projectId,
        title,
        description,
        status: selectedStatus,
        priority: priority.toUpperCase(),
        reporterId: user?.id || '00000000-0000-0000-0000-000000000000',
        type: 'TASK'
      } as any;
      const res = await ticketsAPI.createTicket(input);
      if (res.data) {
        toast({ title: 'Ticket Created', description: 'New ticket added successfully.', type: 'success' });
        fetchTickets(1); // Reset to page 1
        setPage(1);
        setIsModalOpen(false);
      } else {
        toast({ title: 'Creation Failed', description: res.error, type: 'error' });
      }
    }
  };

  return (
    <BaseLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">All Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">View, filter, and manage all cross-project issues.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow border border-transparent text-sm font-semibold transition-all hover:shadow-md"
        >
          <Plus className="w-4 h-4 font-bold" /> Create Ticket
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[60vh]">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white"
            />
          </div>
          <div className="flex gap-3">
            <select 
              value={filterStatusId}
              onChange={(e) => {
                setFilterStatusId(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {uniqueStatusNames.map(name => <option key={name} value={name}>{formatTicketStatusLabel(name)}</option>)}
            </select>
            <select 
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
              <AlertCircle className="w-10 h-10 mb-2 text-gray-300" />
              <p>No tickets found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket Details</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Priority</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                  <th scope="col" className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <Link href={`/tickets/${ticket.id}`} className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          <span className="text-gray-400 font-medium mr-2">TKT-{ticket.id.substring(0,4)}</span> 
                          {ticket.title}
                        </Link>
                        <span className="text-xs text-gray-500 mt-1 font-medium truncate max-w-sm">
                          {projects.find(p => p.id === ticket.projectId)?.name || ticket.projectId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {formatTicketStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <span className="text-sm font-bold text-gray-700">
                        {ticket.priority ? ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase() : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell text-sm text-gray-500 font-medium">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative group/menu inline-block text-left">
                        <button className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <div className="hidden group-hover/menu:block absolute right-0 mt-0 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <button 
                              onClick={() => handleOpenEdit(ticket)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between sm:px-6">
          <p className="text-sm text-gray-700">
            Showing <span className="font-semibold">{Math.min((page - 1) * limit + 1, total)}</span> to <span className="font-semibold">{Math.min(page * limit, total)}</span> of <span className="font-semibold">{total}</span> results
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button 
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
               <h2 className="text-xl font-bold text-gray-900">{editingTicket ? 'Edit Ticket' : 'Create New Ticket'}</h2>
               <button 
                 onClick={() => setIsModalOpen(false)} 
                 className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Project</label>
                    <select 
                      value={projectId}
                      onChange={e => setProjectId(e.target.value)}
                      disabled={!!editingTicket} // Prevent changing project on edit
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white cursor-pointer disabled:opacity-50">
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select 
                      value={statusId}
                      onChange={e => setStatusId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white cursor-pointer">
                      {statuses.map(s => <option key={s.id} value={s.id}>{formatTicketStatusLabel(s.name)}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white"
                    placeholder="Summarize the request/issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea 
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white"
                    placeholder="Provide all details and context..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                  <select 
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white cursor-pointer">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)} 
                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
                  >
                    {editingTicket ? 'Save Changes' : 'Create Ticket'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </BaseLayout>
  );
}
