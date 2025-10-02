'use client';

import { useRouter } from 'next/navigation';

export default function TestRouter() {
  const router = useRouter();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Router Test Page</h1>
      
      <div className="space-y-4">
        <button
          onClick={() => {
            console.log('Attempting router.push to /dashboard');
            try {
              router.push('/dashboard');
              console.log('router.push executed');
            } catch (error) {
              console.error('router.push error:', error);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go to Dashboard (router.push)
        </button>
        
        <button
          onClick={() => {
            console.log('Using window.location.href');
            window.location.href = '/dashboard';
          }}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Go to Dashboard (window.location)
        </button>
        
        <a href="/dashboard" className="block px-4 py-2 bg-purple-500 text-white rounded text-center">
          Go to Dashboard (anchor tag)
        </a>
      </div>
    </div>
  );
}