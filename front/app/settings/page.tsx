import React from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <BaseLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account profile and platform preferences.</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-5">
            <h2 className="text-lg font-bold text-gray-800">Profile Configuration</h2>
            <p className="text-sm text-gray-500">Update your photo and personal details.</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner">JD</div>
              <div className="space-y-2">
                <button className="bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 shadow-sm transition-colors">
                  Change Avatar
                </button>
                <p className="text-xs text-gray-500">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">First Name</label>
                <input type="text" defaultValue="John" className="mt-2 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Last Name</label>
                <input type="text" defaultValue="Doe" className="mt-2 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Email Address</label>
              <input type="email" defaultValue="john.doe@example.com" disabled className="mt-2 block w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-500 px-4 py-3 text-sm shadow-sm cursor-not-allowed" />
              <p className="text-xs text-gray-500 mt-2">Email address cannot be changed directly. Contact an administrator.</p>
            </div>
          </div>
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-end">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md border border-transparent text-sm font-semibold transition-all">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-5">
            <h2 className="text-lg font-bold text-gray-800">Preferences</h2>
            <p className="text-sm text-gray-500">Manage how you receive alerts and platform visuals.</p>
          </div>
          <div className="p-8 space-y-6">
             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500 mt-1">Receive emails when you get mentioned or assigned to a ticket.</p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-500 right-0 z-10 transition-all" checked={true} readOnly />
                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer"></label>
                </div>
             </div>
             
             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Dark Mode</h3>
                  <p className="text-sm text-gray-500 mt-1">Switch to an alternate dark color scheme.</p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle2" id="toggle2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 left-0 z-10 transition-all" checked={false} readOnly />
                    <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                </div>
             </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
