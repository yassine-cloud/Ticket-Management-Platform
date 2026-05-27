"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Clock3, Hash, Loader2, MessageSquare, Paperclip, RefreshCw, Send, Users } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

type ChannelSummary = {
  id: string;
  name?: string;
  type?: string;
  createdAt?: string;
  messageCount?: number;
  members?: Array<{ id: string; username: string; displayName: string; email: string }>;
};

type MessageAuthor = {
  id: string;
  username: string;
  displayName: string;
  email: string;
};

type MessageItem = {
  id: string;
  channelId: string;
  content: string;
  author: MessageAuthor;
  attachments?: Array<{ id: string; filename: string; storagePath: string; mimeType: string; size: number }>;
  editedAt?: string;
  createdAt: string;
  isDeleted: boolean;
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));

const initials = (value?: string) =>
  (value ?? 'U')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const isValidProjectId = (value: string) => Boolean(value && value !== 'undefined' && value !== 'null');

export const MessagingWorkspace = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();

  const initialProjectId = searchParams.get('projectId') ?? '';
  const normalizedProjectId = isValidProjectId(initialProjectId) ? initialProjectId : '';
  const [projectInput, setProjectInput] = useState(normalizedProjectId);
  const [activeProjectId, setActiveProjectId] = useState(normalizedProjectId);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageTotal, setMessageTotal] = useState(0);
  const [draft, setDraft] = useState('');
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) ?? null,
    [channels, selectedChannelId]
  );

  const getAccessToken = () => {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem('ticketPlatform.accessToken');
  };

  useEffect(() => {
    const nextProjectId = isValidProjectId(initialProjectId) ? initialProjectId : '';
    setProjectInput(nextProjectId);
    setActiveProjectId(nextProjectId);
  }, [initialProjectId]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    if (!activeProjectId) {
      setChannels([]);
      setSelectedChannelId('');
      setMessages([]);
      setMessageTotal(0);
      return;
    }

    const loadChannels = async () => {
      setLoadingChannels(true);
      setError(null);

      try {
        const response = await fetch(`/api/channels?projectId=${encodeURIComponent(activeProjectId)}`, {
          credentials: 'include',
          cache: 'no-store'
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message ?? 'Failed to load channels');
        }

        const loadedChannels = Array.isArray(data) ? (data as ChannelSummary[]) : [];
        setChannels(loadedChannels);

        if (loadedChannels.length > 0) {
          setSelectedChannelId((current) => current && loadedChannels.some((channel) => channel.id === current) ? current : loadedChannels[0].id);
        } else {
          setSelectedChannelId('');
          setMessages([]);
          setMessageTotal(0);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load channels');
        setChannels([]);
        setSelectedChannelId('');
        setMessages([]);
        setMessageTotal(0);
      } finally {
        setLoadingChannels(false);
      }
    };

    void loadChannels();
  }, [activeProjectId]);

  useEffect(() => {
    if (!selectedChannelId) {
      setMessages([]);
      setMessageTotal(0);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      setError(null);

      try {
        const response = await fetch(`/api/messages?channelId=${encodeURIComponent(selectedChannelId)}&limit=50&offset=0`, {
          credentials: 'include',
          cache: 'no-store'
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message ?? 'Failed to load messages');
        }

        setMessages(Array.isArray(data.messages) ? (data.messages as MessageItem[]) : []);
        setMessageTotal(typeof data.total === 'number' ? data.total : 0);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load messages');
        setMessages([]);
        setMessageTotal(0);
      } finally {
        setLoadingMessages(false);
      }
    };

    void loadMessages();
  }, [selectedChannelId]);

  const handleOpenProject = () => {
    const nextProjectId = projectInput.trim();
    if (!isValidProjectId(nextProjectId)) {
      setError('Please enter a valid project ID first.');
      return;
    }

    setActiveProjectId(nextProjectId);
    const url = nextProjectId ? `/messages?projectId=${encodeURIComponent(nextProjectId)}` : '/messages';
    router.replace(url);
  };

  const reloadMessages = async () => {
    if (!selectedChannelId) {
      return;
    }

    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/messages?channelId=${encodeURIComponent(selectedChannelId)}&limit=50&offset=0`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message ?? 'Failed to load messages');
      }

      setMessages(Array.isArray(data.messages) ? (data.messages as MessageItem[]) : []);
      setMessageTotal(typeof data.total === 'number' ? data.total : 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    const content = draft.trim();
    if (!selectedChannelId || !content || sending) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ channelId: selectedChannelId, content })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message ?? 'Failed to send message');
      }

      setDraft('');
      await reloadMessages();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-gray-200 bg-white text-sm text-gray-500 shadow-sm">
        Checking your session...
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Authentication required</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-gray-950">Please sign in to open messaging</h2>
          <p className="mt-3 text-sm text-gray-500">
            The messaging screen reads real data from the backend and needs your frontend JWT session before it can load channels.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6 h-full">
      <section className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[720px]">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Messaging</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-950">Real-time channels</h1>
              <p className="mt-2 text-sm text-gray-500">
                Load channels from the backend and send real messages through the authenticated API.
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <MessageSquare className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Project ID</label>
            <div className="flex gap-2">
              <input
                value={projectInput}
                onChange={(event) => setProjectInput(event.target.value)}
                placeholder="Paste a real project UUID"
                className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleOpenProject}
                className="rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
              >
                Open
              </button>
            </div>
            <p className="text-xs text-gray-500">
              The channels list is fetched from <span className="font-semibold text-gray-700">/api/channels</span> using your JWT cookie.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 text-sm text-gray-600">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Users className="h-4 w-4 text-blue-600" />
            Channels
          </div>
          <button
            onClick={reloadMessages}
            disabled={loadingChannels || loadingMessages || !selectedChannelId}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!activeProjectId ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
              Enter a real project ID to load messaging channels from the backend.
            </div>
          ) : loadingChannels ? (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Loading channels...
            </div>
          ) : channels.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
              No channels found for this project or you are not a member of it yet.
            </div>
          ) : (
            channels.map((channel) => {
              const isActive = channel.id === selectedChannelId;
              return (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannelId(channel.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <Hash className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-950">{channel.name ?? 'Untitled channel'}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {channel.type ?? 'channel'} • {channel.messageCount ?? 0} messages
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      {channel.members?.length ?? 0} members
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[720px]">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-500">Conversation</p>
            <h2 className="mt-2 text-xl font-black text-gray-950">
              {selectedChannel?.name ?? 'Select a channel to start'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedChannel ? `${messageTotal} messages loaded from the database` : 'Messages appear here after you select a channel.'}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm">
            <Clock3 className="h-4 w-4 text-blue-600" />
            Live data
          </div>
        </div>

        {error ? (
          <div className="mx-6 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-slate-50">
          {!selectedChannelId ? (
            <div className="flex h-full min-h-[480px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white text-center text-sm text-gray-500">
              Pick a channel from the left to load its messages.
            </div>
          ) : loadingMessages ? (
            <div className="flex min-h-[480px] items-center justify-center text-sm text-gray-500">
              <Loader2 className="mr-3 h-4 w-4 animate-spin text-blue-600" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-[480px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white text-center text-sm text-gray-500">
              No messages yet in this channel.
            </div>
          ) : (
            messages.map((message) => (
              <article key={message.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white shadow-md">
                    {initials(message.author.displayName ?? message.author.username)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-950">{message.author.displayName ?? message.author.username}</p>
                        <p className="text-xs text-gray-500">@{message.author.username} • {formatTime(message.createdAt)}</p>
                      </div>
                      {message.editedAt ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          edited
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {message.content}
                    </p>

                    {message.attachments && message.attachments.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                            <Paperclip className="h-4 w-4 text-blue-600" />
                            <span className="truncate font-medium">{attachment.filename}</span>
                            <span className="ml-auto text-xs text-gray-500">{attachment.mimeType}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 bg-white p-4">
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedChannelId ? 'Write a message to this channel...' : 'Select a channel first'}
              rows={3}
              disabled={!selectedChannelId}
              className="w-full resize-none rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                The message is posted to <span className="font-semibold text-gray-700">/api/messages</span> and stored in the database.
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!selectedChannelId || !draft.trim() || sending}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

