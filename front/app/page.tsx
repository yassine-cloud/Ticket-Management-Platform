import { redirect } from 'next/navigation';

export default function Home() {
  // In a real app we check auth, and either redirect to /login or /dashboard
  redirect('/dashboard');
}