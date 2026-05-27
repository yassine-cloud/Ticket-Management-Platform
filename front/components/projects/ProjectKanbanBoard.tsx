"use client";

import React, { useMemo, useState } from 'react';
import {
  CircleAlert,
  Clock3,
  GripVertical,
  Layers3,
  Palette,
  Sparkles,
  TriangleAlert,
  User2,
} from 'lucide-react';

type TicketStatus = 'To Do' | 'In Progress' | 'Done';

type Ticket = {
  id: string;
  key: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'Low' | 'Medium' | 'High';
  assignee: string;
  updatedAt: string;
  labels: string[];
};

type ProjectKanbanBoardProps = {
  projectId: string;
  onTicketStatusChange?: (ticket: Ticket, fromStatus: TicketStatus, toStatus: TicketStatus) => void | Promise<void>;
};

const statusColumns: Array<{
  id: TicketStatus;
  title: string;
  subtitle: string;
  accent: string;
  glow: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'To Do',
    title: 'To Do',
    subtitle: 'Queued for the team',
    accent: 'from-slate-700 via-slate-600 to-slate-500',
    glow: 'shadow-slate-200/70',
    icon: Layers3,
  },
  {
    id: 'In Progress',
    title: 'In Progress',
    subtitle: 'Being actively worked',
    accent: 'from-blue-700 via-cyan-600 to-sky-500',
    glow: 'shadow-blue-200/70',
    icon: Sparkles,
  },
  {
    id: 'Done',
    title: 'Done',
    subtitle: 'Completed and ready',
    accent: 'from-emerald-700 via-emerald-600 to-teal-500',
    glow: 'shadow-emerald-200/70',
    icon: Palette,
  },
];

const initialTickets: Ticket[] = [
  {
    id: '1',
    key: 'TKT-104',
    title: 'Design backlog filters for the board',
    description: 'Add a compact filter strip so project managers can jump between priorities faster.',
    status: 'To Do',
    priority: 'High',
    assignee: 'Jane Smith',
    updatedAt: '12m ago',
    labels: ['UI', 'Board'],
  },
  {
    id: '2',
    key: 'TKT-118',
    title: 'Refine status badges across ticket views',
    description: 'Make the current status language consistent between the list and the detail page.',
    status: 'To Do',
    priority: 'Medium',
    assignee: 'You',
    updatedAt: '40m ago',
    labels: ['Design', 'Consistency'],
  },
  {
    id: '3',
    key: 'TKT-124',
    title: 'Connect drag events to ticket updates',
    description: 'Prepare the board for persisting status transitions through the API layer later.',
    status: 'In Progress',
    priority: 'High',
    assignee: 'John Doe',
    updatedAt: '5m ago',
    labels: ['API Ready', 'Kanban'],
  },
  {
    id: '4',
    key: 'TKT-131',
    title: 'Improve empty-state copy for columns',
    description: 'Keep empty lanes informative when a status has no cards left.',
    status: 'In Progress',
    priority: 'Low',
    assignee: 'Mia Chen',
    updatedAt: '18m ago',
    labels: ['UX'],
  },
  {
    id: '5',
    key: 'TKT-141',
    title: 'Tighten card spacing and shadows',
    description: 'Reduce the visual weight so cards feel lighter and more modern on the board.',
    status: 'Done',
    priority: 'Low',
    assignee: 'Alex Kim',
    updatedAt: 'Yesterday',
    labels: ['Visual Polish'],
  },
  {
    id: '6',
    key: 'TKT-147',
    title: 'Add board gradient and motion treatment',
    description: 'Introduce a stronger project-board atmosphere without overwhelming the content.',
    status: 'Done',
    priority: 'Medium',
    assignee: 'Sam Lee',
    updatedAt: '2h ago',
    labels: ['Motion', 'Theme'],
  },
];

const priorityStyles: Record<Ticket['priority'], string> = {
  Low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-800 ring-amber-200',
  High: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const avatarStyles = ['bg-blue-600', 'bg-cyan-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600'];

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ProjectKanbanBoard({ projectId, onTicketStatusChange }: ProjectKanbanBoardProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<TicketStatus | null>(null);

  const counts = useMemo(
    () =>
      statusColumns.map((column) => ({
        ...column,
        count: tickets.filter((ticket) => ticket.status === column.id).length,
      })),
    [tickets],
  );

  const activeTicket = draggedTicketId ? tickets.find((ticket) => ticket.id === draggedTicketId) ?? null : null;

  const moveTicket = async (ticketId: string, nextStatus: TicketStatus) => {
    const ticket = tickets.find((item) => item.id === ticketId);

    if (!ticket || ticket.status === nextStatus) {
      return;
    }

    const fromStatus = ticket.status;

    setTickets((currentTickets) =>
      currentTickets.map((item) => (item.id === ticketId ? { ...item, status: nextStatus, updatedAt: 'just now' } : item)),
    );

    setDraggedTicketId(null);
    setHoveredColumn(null);

    await onTicketStatusChange?.({ ...ticket, status: nextStatus }, fromStatus, nextStatus);
  };

  const handleDragStart = (ticketId: string) => {
    setDraggedTicketId(ticketId);
  };

  const handleDragEnd = () => {
    setDraggedTicketId(null);
    setHoveredColumn(null);
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-6 border-b border-white/60 bg-white/70 px-6 py-6 backdrop-blur-sm md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              <CircleAlert className="h-3.5 w-3.5 text-sky-600" />
              Project board {projectId}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Kanban workflow</h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Drag cards between columns to stage status changes locally now. Hook the single status-change callback to
                your update API later without reworking the board UI.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tickets</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{tickets.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Board mode</p>
              <p className="mt-1 text-lg font-bold text-slate-900">Drag and drop</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-3 xl:gap-5">
          {counts.map((column) => {
            const columnTickets = tickets.filter((ticket) => ticket.status === column.id);
            const isHovered = hoveredColumn === column.id;
            const ColumnIcon = column.icon;

            return (
              <div
                key={column.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setHoveredColumn(column.id);
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setHoveredColumn(column.id);
                }}
                onDragLeave={() => {
                  setHoveredColumn((current) => (current === column.id ? null : current));
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedTicketId) {
                    void moveTicket(draggedTicketId, column.id);
                  }
                }}
                className={`group flex min-h-[28rem] flex-col rounded-[1.75rem] border bg-white/80 p-4 shadow-sm transition-all duration-200 ${
                  isHovered ? 'border-sky-300 bg-sky-50/70 shadow-lg shadow-sky-100/80' : 'border-slate-200'
                } ${column.glow}`}
              >
                <div className="mb-4 rounded-[1.35rem] border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${column.accent} text-white shadow-lg`}>
                        <ColumnIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{column.title}</h3>
                        <p className="text-sm text-slate-500">{column.subtitle}</p>
                      </div>
                    </div>

                    <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {column.count}
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full bg-gradient-to-r ${column.accent}`} style={{ width: `${Math.max(20, column.count * 28)}%` }} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  {columnTickets.length > 0 ? (
                    columnTickets.map((ticket, ticketIndex) => {
                      const isDragging = ticket.id === draggedTicketId;

                      return (
                        <article
                          key={ticket.id}
                          draggable
                          onDragStart={() => handleDragStart(ticket.id)}
                          onDragEnd={handleDragEnd}
                          className={`cursor-grab rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.45)] transition-all duration-200 active:cursor-grabbing ${
                            isDragging ? 'scale-[0.98] rotate-[-1deg] border-sky-300 bg-sky-50/80 opacity-70 shadow-sky-200/70' : 'hover:-translate-y-1 hover:shadow-lg'
                          }`}
                          style={{ animationDelay: `${ticketIndex * 40}ms` }}
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                <GripVertical className="h-3.5 w-3.5 text-slate-300" />
                                {ticket.key}
                              </div>
                              <h4 className="mt-2 text-sm font-bold leading-6 text-slate-900">{ticket.title}</h4>
                            </div>

                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ring-1 ${priorityStyles[ticket.priority]}`}>
                              {ticket.priority}
                            </span>
                          </div>

                          <p className="text-sm leading-6 text-slate-600">{ticket.description}</p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {ticket.labels.map((label) => (
                              <span
                                key={label}
                                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                              >
                                {label}
                              </span>
                            ))}
                          </div>

                          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${avatarStyles[ticketIndex % avatarStyles.length]}`}>
                                {getInitials(ticket.assignee)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{ticket.assignee}</p>
                                <p className="text-xs text-slate-500">Updated {ticket.updatedAt}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              Move card
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                        <TriangleAlert className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">No tickets in this column</p>
                      <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
                        Drop a card here to change its status. The API write can be attached in one place later.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Integration hook ready</p>
            <p className="text-sm text-slate-500">
              Wire your update API into <span className="font-semibold text-slate-700">onTicketStatusChange</span> when you are ready.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
            <User2 className="h-3.5 w-3.5" />
            Local board state only
          </div>
        </div>
        {activeTicket ? (
          <p className="mt-3 text-xs text-slate-500">
            Currently dragging <span className="font-semibold text-slate-700">{activeTicket.key}</span>. Release it on a column to stage a move.
          </p>
        ) : null}
      </div>
    </div>
  );
}