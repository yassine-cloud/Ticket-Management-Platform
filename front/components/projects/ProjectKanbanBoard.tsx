"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  MoreHorizontal, Plus, X, GripVertical, AlertCircle, CalendarClock, MessageSquare
} from 'lucide-react';
import { formatTicketStatusLabel, ticketsAPI, Ticket, Status, CreateTicketInput } from '../../lib/api/tickets.api';
import { useToast } from '../ui/Toast';

// For optimistic IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

const priorityColors: Record<string, { bg: string, text: string, ring: string }> = {
  LOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  HIGH: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
};

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
}

export function ProjectKanbanBoard({ projectId }: { projectId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string, name: string } | null>(null);

  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStatusId, setNewStatusId] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  const { toast } = useToast();

  // Ref to prevent duplicate toasts for rapid SSE events
  const lastEventRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribeSSE: (() => void) | undefined;

    async function init() {
      try {
        setLoading(true);
        const [sessionRes, ticketsRes, statusesRes] = await Promise.all([
          fetch('/api/auth/session').then(r => r.json()).catch(() => null),
          ticketsAPI.getTickets(projectId),
          ticketsAPI.getStatuses(projectId)
        ]);

        if (!active) return;

        if (sessionRes?.user) {
          setCurrentUser(sessionRes.user);
        }

        if (statusesRes.data) {
          setStatuses(statusesRes.data);
          if (statusesRes.data.length > 0) setNewStatusId(statusesRes.data[0].id);
        }

        if (ticketsRes.data) {
          setTickets(ticketsRes.data);
        }

        // Setup SSE
        const cleanup = await ticketsAPI.listenToTicketEvents((ev) => {
          if (!active) return;
          const eventId = `${ev.type}-${ev.data?.id}`;
          if (lastEventRef.current === eventId) return; // Basic debounce
          lastEventRef.current = eventId;

          if (ev.data?.projectId !== projectId) return; // Ensure it belongs to this project

          if (ev.type === 'ticket-created') {
            setTickets(prev => {
              if (prev.find(t => t.id === ev.data.id)) return prev;
              return [...prev, ev.data];
            });
            toast({ title: 'Ticket Created', description: ev.data.title, type: 'success' });
          } else if (ev.type === 'ticket-updated') {
            setTickets(prev => prev.map(t => t.id === ev.data.id ? ev.data : t));
            toast({ title: 'Ticket Updated', description: `TKT-${ev.data.id.substring(0, 4)} was modified.`, type: 'info' });
          } else if (ev.type === 'ticket-deleted') {
            setTickets(prev => prev.filter(t => t.id !== ev.data.id));
            toast({ title: 'Ticket Deleted', description: `A ticket was removed.`, type: 'error' });
          }
        }, (err) => {
          console.error("SSE Error:", err);
        });

        if (!active) {
          if (cleanup) cleanup();
          return;
        }

        if (cleanup) unsubscribeSSE = cleanup;

      } finally {
        if (active) setLoading(false);
      }
    }
    init();

    return () => {
      active = false;
      if (unsubscribeSSE) unsubscribeSSE();
    };
  }, [projectId, toast]);

  const moveTicket = async (ticketId: string, nextStatusId: string) => {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket || ticket.status === nextStatusId) return;


    setTickets((currentTickets) =>
      currentTickets.map((item) =>
        item.id === ticketId
          ? { ...item, status: nextStatusId as Ticket['status'], updatedAt: new Date().toISOString() }
          : item
      ),
    );
    setDraggedTicketId(null);
    setHoveredColumn(null);

    toast({ title: 'Ticket Moved', description: `TKT-${ticket.id.substring(0, 4)} moved.`, type: 'info' });

    const res = await ticketsAPI.updateTicket(ticketId, { status: nextStatusId as Ticket['status'] });
    if (!res.data && res.error) {
      toast({ title: 'Failed to move ticket', description: res.error, type: 'error' });
      // Revert: restore original status value
      setTickets((currentTickets) =>
        currentTickets.map((item) =>
          item.id === ticketId ? { ...item, status: ticket.status } : item
        ),
      );
    } else if (res.data) {
      // Replace with the server's authoritative version
      setTickets((currentTickets) =>
        currentTickets.map((item) => (item.id === ticketId ? res.data! : item)),
      );
    }
  };




  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newStatusId) return;

    // Backend enums are SCREAMING_SNAKE_CASE (e.g. TASK, MEDIUM, HIGH)
    const input: CreateTicketInput = {
      projectId,
      title: newTitle,
      description: newDesc,
      status: newStatusId as Ticket['status'],
      reporterId: currentUser?.id || '00000000-0000-0000-0000-000000000000',
      priority: newPriority.toUpperCase(),
      type: 'TASK' as any,
    };

    // Optimistic
    const tempId = generateId();
    const optimisticTicket: Ticket = {
      id: tempId,
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;

    setTickets(prev => [...prev, optimisticTicket]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewPriority('Medium');

    toast({ title: 'Ticket Created', description: newTitle, type: 'success' });

    const res = await ticketsAPI.createTicket(input);
    if (res.data) {
      setTickets(prev => prev.map(t => t.id === tempId ? res.data! : t));
    } else {
      // Revert if error
      setTickets(prev => prev.filter(t => t.id !== tempId));
      toast({ title: 'Failed to create ticket', description: res.error || 'Unknown error', type: 'error' });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Kanban Board</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage project workflow & tracking</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
          <Plus className="w-5 h-5" /> New Ticket
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 px-1 snap-x scroll-smooth hide-scrollbar">
        {statuses.map(status => {
          const colTickets = tickets.filter(t => t.status === status.id);
          const isHovered = hoveredColumn === status.id;
          const statusTone = status.id === 'RESOLVED' || status.id === 'CLOSED'
            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            : status.id === 'IN_PROGRESS'
              ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
              : 'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.5)]';

          return (
            <div
              key={status.id}
              onDragOver={(e) => { e.preventDefault(); setHoveredColumn(status.id); }}
              onDragEnter={(e) => { e.preventDefault(); setHoveredColumn(status.id); }}
              onDragLeave={() => setHoveredColumn(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedTicketId) moveTicket(draggedTicketId, status.id);
              }}
              className={`min-w-[320px] max-w-[320px] snap-center flex-shrink-0 flex flex-col bg-slate-50/50 backdrop-blur-sm rounded-3xl p-5 border-2 transition-all duration-300 ${isHovered ? 'border-blue-400 bg-blue-50/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'border-slate-100/80 shadow-sm'}`}
            >
              <div className="flex justify-between items-center mb-5 px-1">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusTone}`} />
                  <h3 className="font-bold text-slate-800 tracking-wide">{formatTicketStatusLabel(status.name)}</h3>
                </div>
                <span className="bg-white text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm border border-slate-100">{colTickets.length}</span>
              </div>

              <div className="flex flex-col gap-3 min-h-[200px]">
                {colTickets.map(ticket => {
                  const pColor = priorityColors[ticket.priority.toUpperCase()] || priorityColors.MEDIUM;
                  return (
                    <article
                      key={ticket.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedTicketId(ticket.id);
                        // Add a slight transparency to the dragged item
                        e.currentTarget.style.opacity = '0.5';
                      }}
                      onDragEnd={(e) => {
                        setDraggedTicketId(null);
                        setHoveredColumn(null);
                        e.currentTarget.style.opacity = '1';
                      }}
                      className="group bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-blue-200 cursor-grab active:cursor-grabbing hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-200 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-slate-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-extrabold text-slate-400 tracking-wider">TKT-{ticket.id.substring(0, 4)}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ring-1 ring-inset ${pColor.bg} ${pColor.text} ${pColor.ring}`}>
                          {ticket.priority}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm leading-snug mb-2 group-hover:text-blue-600 transition-colors">{ticket.title}</h4>
                      {ticket.description && <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{ticket.description}</p>}

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
                            {getInitials(currentUser?.name || 'User')}
                          </div>
                          {ticket.createdAt && (
                            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <CalendarClock className="w-3 h-3" />
                              {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>

                        {/* Using generic delete fetch for now */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Are you sure you want to delete this ticket?')) return;

                            setTickets(prev => prev.filter(t => t.id !== ticket.id));
                            toast({ title: 'Ticket Deleted', description: `TKT-${ticket.id.substring(0, 4)} was deleted.`, type: 'success' });
                            try {
                              const { fetchWithAuth } = await import('../../lib/api/projects.api');
                              const { backendUrls } = await import('../../lib/urls');
                              await fetchWithAuth(backendUrls.tickets.delete(ticket.id), { method: 'DELETE' });
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </article>
                  )
                })}
                {colTickets.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-slate-200/60 rounded-2xl bg-white/20">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                      <Plus className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">Drop here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative animate-in slide-in-from-bottom-8 fade-in duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-xl text-slate-800">Create New Ticket</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-100 hover:shadow transition-all"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddTicket} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Title <span className="text-rose-500">*</span></label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="What needs to be done?"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[120px] resize-none"
                  placeholder="Provide details and context..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Status</label>
                  <select
                    value={newStatusId}
                    onChange={e => setNewStatusId(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none bg-white"
                  >
                    {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 font-bold bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 rounded-xl transition-all">Create Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}