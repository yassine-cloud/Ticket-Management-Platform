import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, FolderKanban, Ticket, Users, Settings } from 'lucide-react';

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 font-medium">
          <LayoutDashboard className="w-5 h-5 text-gray-500" />
          Dashboard
        </Link>
        <Link href="/projects" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 font-medium">
          <FolderKanban className="w-5 h-5 text-gray-500" />
          Projects
        </Link>
        <Link href="/tickets" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 font-medium">
          <Ticket className="w-5 h-5 text-gray-500" />
          Tickets
        </Link>
        <Link href="/team" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 font-medium">
          <Users className="w-5 h-5 text-gray-500" />
          Team
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 font-medium">
          <Settings className="w-5 h-5 text-gray-500" />
          Settings
        </Link>
      </div>
    </aside>
  );
};
