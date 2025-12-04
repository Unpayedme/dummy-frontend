import { redirect } from 'next/navigation';

export default function LandingPage() {
  // Server-side redirect to home page (default page)
  redirect('/home');
}
