"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock3,
  Hash,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  X,
  SquarePen,
  Users,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { projectsAPI, type Project } from '@/lib/api/projects.api';
import { backendUrls } from '@/lib/urls';
import { io, type Socket } from 'socket.io-client';


type ChannelSummary = {
  id: string;
  projectId?: string;
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

type ProjectTreeItem = Project & {
  channels: ChannelSummary[];
  channelsLoaded: boolean;
  channelsLoading: boolean;
};

type LocalAttachmentDraft = {
  id: string;
  file: File;
  previewUrl: string;
  isImage: boolean;
};

type UploadSignatureResponse = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageFile = (file: File) => file.type.startsWith('image/');

const createDraftFromFile = (file: File): LocalAttachmentDraft => ({
  id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
  file,
  previewUrl: URL.createObjectURL(file),
  isImage: isImageFile(file),
});

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));

const initials = (value?: string) =>
  (value ?? 'U')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const isValidId = (value: string) => Boolean(value && value !== 'undefined' && value !== 'null');

const buildMessagesUrl = (projectId?: string, channelId?: string) => {
  const searchParams = new URLSearchParams();
  if (projectId) searchParams.set('projectId', projectId);
  if (channelId) searchParams.set('channelId', channelId);
  const query = searchParams.toString();
  return query ? `/messages?${query}` : '/messages';
};

export const MessagingWorkspace = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();

  const initialProjectId = searchParams.get('projectId') ?? '';
  const initialChannelId = searchParams.get('channelId') ?? '';
  const normalizedProjectId = isValidId(initialProjectId) ? initialProjectId : '';
  const normalizedChannelId = isValidId(initialChannelId) ? initialChannelId : '';

  const [projects, setProjects] = useState<ProjectTreeItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(normalizedProjectId);
  const [selectedChannelId, setSelectedChannelId] = useState(normalizedChannelId);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageTotal, setMessageTotal] = useState(0);
  const [draft, setDraft] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateChannelFor, setShowCreateChannelFor] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [attachmentDrafts, setAttachmentDrafts] = useState<LocalAttachmentDraft[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentDraftsRef = useRef<LocalAttachmentDraft[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const selectedChannel = useMemo(() => {
    if (!selectedProject) return null;
    return selectedProject.channels.find((channel) => channel.id === selectedChannelId) ?? null;
  }, [selectedProject, selectedChannelId]);

  const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('ticketPlatform.accessToken');
  };

  const syncUrl = useCallback((nextProjectId?: string, nextChannelId?: string) => {
    router.replace(buildMessagesUrl(nextProjectId, nextChannelId));
  }, [router]);

  const setProjectChannels = useCallback((projectId: string, channels: ChannelSummary[]) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              channels,
              channelsLoaded: true,
              channelsLoading: false,
            }
          : project
      )
    );
  }, []);

  useEffect(() => {
    attachmentDraftsRef.current = attachmentDrafts;
  }, [attachmentDrafts]);

  useEffect(() => {
    return () => {
      attachmentDraftsRef.current.forEach((draft) => URL.revokeObjectURL(draft.previewUrl));
    };
  }, []);

  const handleAttachmentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setAttachmentDrafts((current) => [...current, ...files.map(createDraftFromFile)]);
    event.target.value = '';
  };

  const removeAttachmentDraft = (draftId: string) => {
    setAttachmentDrafts((current) => {
      const nextDrafts = current.filter((draft) => draft.id !== draftId);
      const removed = current.find((draft) => draft.id === draftId);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return nextDrafts;
    });
  };

  const uploadAttachmentDrafts = async (): Promise<string[]> => {
    if (attachmentDrafts.length === 0) return [];

    const signatureResponse = await fetch('/api/messages/upload-signature', {
      method: 'POST',
      credentials: 'include',
    });

    const signatureData = (await signatureResponse.json().catch(() => ({}))) as Partial<UploadSignatureResponse> & {
      message?: string;
    };
    if (!signatureResponse.ok) {
      throw new Error(signatureData.message ?? 'Failed to prepare attachment upload');
    }

    const signature = signatureData as UploadSignatureResponse;

    const uploads = await Promise.all(
      attachmentDrafts.map(async (draft) => {
        const formData = new FormData();
        formData.append('file', draft.file);
        formData.append('api_key', signature.apiKey);
        formData.append('timestamp', String(signature.timestamp));
        formData.append('signature', signature.signature);
        formData.append('folder', signature.folder);

        const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`, {
          method: 'POST',
          body: formData,
        });

        const cloudinaryData = await cloudinaryResponse.json().catch(() => ({}));
        if (!cloudinaryResponse.ok) {
          throw new Error(cloudinaryData.error?.message ?? `Failed to upload ${draft.file.name}`);
        }

        return String(cloudinaryData.secure_url ?? '');
      })
    );

    return uploads.filter(Boolean);
  };

  const loadChannelsForProject = useCallback(async (projectId: string) => {
    if (!projectId) return [] as ChannelSummary[];

    const cachedProject = projects.find((project) => project.id === projectId);
    if (cachedProject?.channelsLoaded) {
      return cachedProject.channels;
    }

    setProjects((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, channelsLoading: true } : project
      )
    );

    try {
      const response = await fetch(`/api/channels?projectId=${encodeURIComponent(projectId)}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message ?? 'Failed to load channels');
      }

      const loadedChannels = Array.isArray(data) ? (data as ChannelSummary[]) : [];
      setProjectChannels(projectId, loadedChannels);
      return loadedChannels;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load channels');
      setProjectChannels(projectId, []);
      return [] as ChannelSummary[];
    }
  }, [projects, setProjectChannels]);

  const reloadMessages = useCallback(async () => {
    if (!selectedChannelId) return;

    setLoadingMessages(true);
    setError(null);

    try {
      const response = await fetch(`/api/messages?channelId=${encodeURIComponent(selectedChannelId)}&limit=50&offset=0`, {
        credentials: 'include',
        cache: 'no-store',
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
  }, [selectedChannelId]);

  const upsertIncomingMessage = useCallback((incoming: MessageItem) => {
    let inserted = false;
    setMessages((current) => {
      inserted = !current.some((message) => message.id === incoming.id);
      const next = current.filter((message) => message.id !== incoming.id);
      next.push(incoming);
      next.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
      return next;
    });
    if (inserted) {
      setMessageTotal((current) => current + 1);
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;

    let mounted = true;

    const loadProjects = async () => {
      setLoadingProjects(true);
      setError(null);

      try {
        const response = await projectsAPI.getProjects();
        if (!mounted) return;

        if (response.error) {
          throw new Error(response.error);
        }

        const loadedProjects = (response.data ?? []).map((project) => ({
          ...project,
          channels: [],
          channelsLoaded: false,
          channelsLoading: false,
        }));

        setProjects(loadedProjects);

        const nextProjectId = normalizedProjectId || loadedProjects[0]?.id || '';
        if (nextProjectId) {
          setSelectedProjectId(nextProjectId);
          syncUrl(nextProjectId, normalizedChannelId || undefined);
        }
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load projects');
        setProjects([]);
      } finally {
        if (mounted) setLoadingProjects(false);
      }
    };

    void loadProjects();

    return () => {
      mounted = false;
    };
  }, [status, normalizedProjectId, normalizedChannelId, syncUrl]);

  useEffect(() => {
    if (status !== 'authenticated' || !selectedProjectId) {
      return;
    }

    let mounted = true;

    const loadProjectContext = async () => {
      const channels = await loadChannelsForProject(selectedProjectId);
      if (!mounted) return;

      const nextChannelId =
        (normalizedChannelId && channels.some((channel) => channel.id === normalizedChannelId)
          ? normalizedChannelId
          : '') ||
        (selectedChannelId && channels.some((channel) => channel.id === selectedChannelId)
          ? selectedChannelId
          : '') ||
        channels[0]?.id ||
        '';

      if (nextChannelId && nextChannelId !== selectedChannelId) {
        setSelectedChannelId(nextChannelId);
        syncUrl(selectedProjectId, nextChannelId);
      } else if (selectedProjectId && !normalizedChannelId) {
        syncUrl(selectedProjectId, nextChannelId);
      }

    };

    void loadProjectContext();

    return () => {
      mounted = false;
    };
  }, [status, selectedProjectId, normalizedProjectId, normalizedChannelId, selectedChannelId, loadChannelsForProject, syncUrl]);

  useEffect(() => {
    void reloadMessages();
  }, [selectedChannelId, reloadMessages]);

  useEffect(() => {
    if (status !== 'authenticated' || !selectedChannelId) {
      return;
    }

    const socket = io(backendUrls.ws, {
      transports: ['websocket'],
      withCredentials: true,
      auth: {
        token: getAccessToken(),
      },
    });

    socketRef.current = socket;
    socket.emit('join-channel', { channelId: selectedChannelId, userId: '' });

    socket.on('message.created', (payload: { channelId: string; message: MessageItem }) => {
      if (payload.channelId === selectedChannelId) {
        upsertIncomingMessage(payload.message);
      }
    });

    socket.on('message.updated', (payload: { channelId: string; message: MessageItem }) => {
      if (payload.channelId === selectedChannelId) {
        setMessages((current) => current.map((message) => (message.id === payload.message.id ? payload.message : message)));
      }
    });

    socket.on('message.deleted', (payload: { channelId: string; messageId: string }) => {
      if (payload.channelId === selectedChannelId) {
        setMessages((current) => current.filter((message) => message.id !== payload.messageId));
        setMessageTotal((current) => Math.max(0, current - 1));
      }
    });

    return () => {
      socket.emit('leave-channel', { channelId: selectedChannelId, userId: '' });
      socket.off('message.created');
      socket.off('message.updated');
      socket.off('message.deleted');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedChannelId, status, upsertIncomingMessage]);

  const handleSelectProject = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedChannelId('');
    setShowCreateChannelFor(null);
    setNewChannelName('');
    syncUrl(projectId, undefined);
    const channels = await loadChannelsForProject(projectId);
    const nextChannelId = channels[0]?.id ?? '';
    if (nextChannelId) {
      setSelectedChannelId(nextChannelId);
      syncUrl(projectId, nextChannelId);
    }
  };

  const handleSelectChannel = (projectId: string, channelId: string) => {
    setSelectedProjectId(projectId);
    setSelectedChannelId(channelId);
    syncUrl(projectId, channelId);
  };

  const createChannel = async () => {
    if (!selectedProjectId || !newChannelName.trim() || creatingChannel) return;

    setCreatingChannel(true);
    setError(null);

    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ projectId: selectedProjectId, name: newChannelName.trim(), type: 'PROJECT' }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message ?? 'Failed to create channel');
      }

      const refreshedChannels = await loadChannelsForProject(selectedProjectId);
      const createdChannel = Array.isArray(data) ? null : (data as ChannelSummary | null);
      const nextChannelId = createdChannel?.id ?? refreshedChannels[0]?.id ?? '';
      setNewChannelName('');
      setShowCreateChannelFor(null);

      if (nextChannelId) {
        setSelectedChannelId(nextChannelId);
        syncUrl(selectedProjectId, nextChannelId);
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create channel');
    } finally {
      setCreatingChannel(false);
    }
  };

  const handleSendMessage = async () => {
    const content = draft.trim();
    const hasAttachments = attachmentDrafts.length > 0;
    if (!selectedChannelId || (!content && !hasAttachments) || sending || uploadingAttachments) return;

    setSending(true);
    setError(null);

    try {
      let attachmentUrls: string[] = [];
      if (hasAttachments) {
        setUploadingAttachments(true);
        attachmentUrls = await uploadAttachmentDrafts();
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          channelId: selectedChannelId,
          content,
          attachmentUrls,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message ?? 'Failed to send message');
      }

      setDraft('');
      attachmentDrafts.forEach((draft) => URL.revokeObjectURL(draft.previewUrl));
      setAttachmentDrafts([]);
      await reloadMessages();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message');
    } finally {
      setUploadingAttachments(false);
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
            Messaging loads your accessible projects and channels from the backend using your authenticated session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 h-full">
      <section className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[720px]">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Messaging</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-950">Projects and channels</h1>
              <p className="mt-2 text-sm text-gray-500">
                Browse the projects you belong to, then open the related channel tree without typing a project ID.
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <MessageSquare className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 text-sm text-gray-600">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Users className="h-4 w-4 text-blue-600" />
            Projects
          </div>
          <button
            onClick={() => void loadChannelsForProject(selectedProjectId)}
            disabled={loadingProjects || !selectedProjectId}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingProjects ? (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Loading your projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
              No accessible projects found for your account.
            </div>
          ) : (
            projects.map((project) => {
              const isSelected = project.id === selectedProjectId;
              return (
                <div
                  key={project.id}
                  className={`rounded-2xl border transition ${isSelected ? 'border-blue-500 bg-blue-50/70 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                >
                  <button
                    onClick={() => void handleSelectProject(project.id)}
                    className="w-full text-left px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-950 truncate">{project.name}</p>
                        <p className="mt-1 text-xs text-gray-500">{project.slug} • {project.isPublic ? 'Public' : 'Private'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                          {project.channels.length} channels
                        </span>
                        {isSelected ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                  </button>

                  {isSelected ? (
                    <div className="border-t border-white/70 px-3 pb-3">
                      <div className="mb-2 flex items-center justify-between px-1 pt-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Channels</p>
                        <button
                          onClick={() => setShowCreateChannelFor((current) => (current === project.id ? null : project.id))}
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </button>
                      </div>

                      {showCreateChannelFor === project.id ? (
                        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2">
                          <SquarePen className="h-4 w-4 text-gray-400" />
                          <input
                            value={newChannelName}
                            onChange={(event) => setNewChannelName(event.target.value)}
                            placeholder="Channel name"
                            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                          />
                          <button
                            onClick={() => void createChannel()}
                            disabled={!newChannelName.trim() || creatingChannel}
                            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-blue-300"
                          >
                            {creatingChannel ? 'Creating...' : 'Create'}
                          </button>
                        </div>
                      ) : null}

                      <div className="space-y-1">
                        {!project.channelsLoaded && project.channelsLoading ? (
                          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            Loading channels...
                          </div>
                        ) : project.channels.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-xs text-gray-500">
                            This project has no channels yet.
                          </div>
                        ) : (
                          project.channels.map((channel) => {
                            const isActive = channel.id === selectedChannelId;
                            return (
                              <button
                                key={channel.id}
                                onClick={() => handleSelectChannel(project.id, channel.id)}
                                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                              >
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/15' : 'bg-gray-100 text-gray-600'}`}>
                                  <Hash className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">{channel.name ?? 'Untitled channel'}</p>
                                  <p className={`mt-0.5 text-[11px] ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {channel.type ?? 'channel'} • {channel.messageCount ?? 0} messages
                                  </p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
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
              {selectedProject ? `${selectedProject.name} / ${selectedChannel?.name ?? 'Select a channel'}` : 'Select a project'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedChannel
                ? `${messageTotal} messages loaded from the database`
                : 'Pick a project and channel from the tree on the left.'}
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
          {!selectedProjectId ? (
            <div className="flex h-full min-h-[480px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white text-center text-sm text-gray-500">
              Choose one of your projects to see its related channels.
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
                      <div className="mt-4 space-y-3">
                        {message.attachments.map((attachment) => {
                          const isImage = attachment.mimeType.startsWith('image/');

                          return (
                            <a
                              key={attachment.id}
                              href={attachment.storagePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm transition hover:border-blue-200 hover:bg-gray-100"
                            >
                              {isImage ? (
                                <img
                                  src={attachment.storagePath}
                                  alt={attachment.filename}
                                  className="max-h-[360px] w-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700">
                                  <Paperclip className="h-4 w-4 text-blue-600" />
                                  <span className="truncate font-medium">{attachment.filename}</span>
                                  <span className="ml-auto text-xs text-gray-500">Open attachment</span>
                                </div>
                              )}

                              {isImage ? (
                                <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700">
                                  <Paperclip className="h-4 w-4 text-blue-600" />
                                  <span className="truncate font-medium">{attachment.filename}</span>
                                  <span className="ml-auto text-xs text-gray-500">{attachment.mimeType}</span>
                                </div>
                              ) : null}
                            </a>
                          );
                        })}
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
            {attachmentDrafts.length > 0 ? (
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                {attachmentDrafts.map((attachment) => (
                  <div key={attachment.id} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    {attachment.isImage ? (
                      <img
                        src={attachment.previewUrl}
                        alt={attachment.file.name}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-gray-50 px-4 text-center text-sm text-gray-500">
                        <div>
                          <p className="font-semibold text-gray-900">{attachment.file.name}</p>
                          <p className="mt-1 text-xs text-gray-500">{attachment.file.type || 'file'} • {formatFileSize(attachment.file.size)}</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => removeAttachmentDraft(attachment.id)}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white"
                      aria-label={`Remove ${attachment.file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-600">
                      {attachment.file.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedChannelId ? 'Write a message to this channel...' : 'Select a channel first'}
              rows={3}
              disabled={!selectedChannelId}
              className="w-full resize-none rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-gray-500">
                The message is posted to <span className="font-semibold text-gray-700">/api/messages</span> and attachments are uploaded through Cloudinary first.
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentSelection}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedChannelId}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Paperclip className="h-4 w-4" />
                  Attach
                </button>

                <button
                  onClick={() => void handleSendMessage()}
                  disabled={!selectedChannelId || (!draft.trim() && attachmentDrafts.length === 0) || sending || uploadingAttachments}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {sending || uploadingAttachments ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {uploadingAttachments ? 'Uploading...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
