"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { Ticket, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

type AnalyticsSummary = {
  counts: {
    total: number;
    open: number;
    closed: number;
  };
  averageResponseTime: {
    averageMinutes: number | null;
    sampleSize: number;
  };
  slaBreaches: {
    breaches: number;
    evaluatedTickets: number;
    responseTimeMinutes: number | null;
  };
};

export default function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.displayName ?? user?.username ?? 'there';
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/summary', { cache: 'no-store' });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message ?? 'Failed to load analytics');
        }

        const data = (await response.json()) as AnalyticsSummary;
        if (isActive) {
          setAnalytics(data);
          setAnalyticsError(null);
        }
      } catch (error) {
        if (isActive) {
          setAnalyticsError(error instanceof Error ? error.message : 'Failed to load analytics');
        }
      }
    };

    loadAnalytics();
    return () => {
      isActive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const counts = analytics?.counts;
    const avgMinutes = analytics?.averageResponseTime?.averageMinutes ?? null;
    const avgHours = avgMinutes === null ? '—' : `${(avgMinutes / 60).toFixed(1)}h`;
    const breaches = analytics?.slaBreaches?.breaches ?? 0;

    return [
      {
        label: 'Open Tickets',
        value: counts ? String(counts.open) : '—',
        icon: Ticket,
        trend: analyticsError ? 'Unavailable' : 'Live',
        trendUp: !analyticsError,
        color: 'text-blue-600',
        bg: 'bg-blue-100'
      },
      {
        label: 'Resolved Tickets',
        value: counts ? String(counts.closed) : '—',
        icon: CheckCircle,
        trend: analyticsError ? 'Unavailable' : 'Live',
        trendUp: !analyticsError,
        color: 'text-green-600',
        bg: 'bg-green-100'
      },
      {
        label: 'Avg Response Time',
        value: avgHours,
        icon: Clock,
        trend: analyticsError ? 'Unavailable' : 'Live',
        trendUp: !analyticsError,
        color: 'text-purple-600',
        bg: 'bg-purple-100'
      },
      {
        label: 'SLA Breaches',
        value: analytics ? String(breaches) : '—',
        icon: AlertTriangle,
        trend: analyticsError ? 'Unavailable' : 'Live',
        trendUp: analyticsError ? false : breaches === 0,
        color: 'text-orange-600',
        bg: 'bg-orange-100'
      }
    ];
  }, [analytics, analyticsError]);

  return (
    <BaseLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {displayName}. Here is a quick overview of your workspace.</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`font-semibold ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend}
                </span>
                <span className="text-gray-500 ml-2">from last week</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Recent Tickets</h2>
              <Link href="/tickets" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All &rarr;</Link>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                      JD
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">TKT-{100 + item} : Fix login authentication issue</p>
                      <p className="text-xs text-gray-500 mt-1">Project Alpha • Updated 2h ago</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 shrink-0">
                    In Progress
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Activity Feed</h2>
            <div className="relative border-l border-gray-200 ml-3 space-y-6">
              {[
                { time: 'Just now', user: 'Jane Smith', action: 'resolved ticket', ticket: 'TKT-104' },
                { time: '2 hours ago', user: 'John Doe', action: 'commented on', ticket: 'TKT-101' },
                { time: 'Yesterday', user: 'Alice', action: 'assigned you to', ticket: 'TKT-098' },
              ].map((act, i) => (
                <div key={i} className="pl-6 relative">
                  <span className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[6.5px] top-1 ring-4 ring-white"></span>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{act.user}</span> {act.action} <span className="font-semibold text-blue-600">{act.ticket}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{act.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
