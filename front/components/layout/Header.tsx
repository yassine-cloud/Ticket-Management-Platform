"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Search, Settings, LogOut, UserCircle, Menu, Check } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ticketsAPI } from '@/lib/api/tickets.api';

interface Notification {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}

export const Header = () => {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastEventRef = useRef<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribeSSE: (() => void) | undefined;
    
    async function setupSSE() {
      const cleanup = await ticketsAPI.listenToTicketEvents((ev) => {
        if (!active) return;
        const eventId = `${ev.type}-${ev.data?.id}-${Date.now()}`;
        if (lastEventRef.current === eventId) return;
        lastEventRef.current = eventId;

        let text = '';
        if (ev.type === 'ticket-created') text = `New ticket created: ${ev.data.title}`;
        else if (ev.type === 'ticket-updated') text = `Ticket TKT-${ev.data.id.substring(0,4)} was updated`;
        else if (ev.type === 'ticket-deleted') text = `Ticket TKT-${ev.data.id.substring(0,4)} was deleted`;
        else return;

        const newNotif: Notification = {
          id: eventId,
          text,
          time: 'Just now',
          unread: true
        };

        setNotifications(prev => [newNotif, ...prev].slice(0, 10)); // keep last 10
      });
      if (!active) {
        if (cleanup) cleanup();
        return;
      }
      if (cleanup) unsubscribeSSE = cleanup;
    }
    setupSSE();

    return () => {
      active = false;
      if (unsubscribeSSE) unsubscribeSSE();
    };
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const profileName = user?.displayName ?? user?.username ?? 'User';
  const profileEmail = user?.email ?? 'user@example.com';
  const initials = profileName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    router.replace('/auth/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button className="md:hidden text-gray-500 hover:text-gray-700">
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative ml-4 md:ml-8 hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tickets, projects..."
            className="pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-6">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsProfileOpen(false);
            }}
            className="text-gray-500 hover:text-blue-600 relative transition-colors focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-4 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                <p className="text-sm font-bold text-gray-900">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">No new notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${notif.unread ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.unread ? 'bg-blue-600' : 'bg-transparent'}`}></div>
                        <div>
                          <p className={`text-sm ${notif.unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{notif.text}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 text-center border-t border-gray-100">
                <button className="text-sm text-blue-600 font-semibold hover:underline">View all activity</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationOpen(false);
            }}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
              {initials}
            </div>
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-4 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                <p className="text-sm font-semibold text-gray-900">{profileName}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{profileEmail}</p>
              </div>
              <div className="py-2">
                <Link 
                  href="/settings" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <UserCircle className="w-4 h-4 text-gray-400 group-hover:text-blue-600" /> My Profile
                </Link>
                <Link 
                  href="/settings" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400 group-hover:text-blue-600" /> Account Settings
                </Link>
              </div>
              <div className="border-t border-gray-100 my-1"></div>
              <div className="py-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

