import React from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/80 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl shadow-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">TP</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join TicketPlatform today
          </p>
        </div>
        <form className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-700">Full Name</label>
            <input type="text" required className="mt-1 appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm" placeholder="John Doe" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Email address</label>
            <input type="email" required className="mt-1 appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <input type="password" required className="mt-1 appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm" placeholder="••••••••" />
          </div>

          <div className="pt-2">
            <Link href="/dashboard">
                <button type="button" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg">
                Create Account
                </button>
            </Link>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-all">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
