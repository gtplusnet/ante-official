'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function MinimalTest() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    console.log('MinimalTest component mounted');
  }, []);

  const handleLinkClick = (e: React.MouseEvent) => {
    console.log('Link clicked', e);
    setClickCount(prev => prev + 1);
  };

  const handleButtonClick = () => {
    console.log('Button clicked, attempting navigation');
    setClickCount(prev => prev + 1);
    try {
      router.push('/dashboard');
      console.log('router.push called successfully');
    } catch (err: any) {
      console.error('Navigation error:', err);
      setError(err.message);
    }
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Minimal Navigation Test</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <p>This is a minimal test with no auth, no providers, just basic React/Next.js</p>
        <p>Click count: {clickCount}</p>
        <p>Component mounted: {mounted ? 'Yes' : 'No'}</p>
        {error && <p className="text-red-600">Error: {error}</p>}
      </div>

      <div className="space-y-4">
        <div>
          <p className="font-semibold mb-2">Test 1: Basic Next.js Link</p>
          <Link 
            href="/dashboard" 
            onClick={handleLinkClick}
            className="text-blue-500 underline"
          >
            Click here to go to Dashboard
          </Link>
        </div>

        <div>
          <p className="font-semibold mb-2">Test 2: Button with router.push</p>
          <button 
            onClick={handleButtonClick}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Navigate to Dashboard
          </button>
        </div>

        <div>
          <p className="font-semibold mb-2">Test 3: Plain anchor tag</p>
          <a href="/dashboard" className="text-green-500 underline">
            Plain HTML link to Dashboard
          </a>
        </div>

        <div>
          <p className="font-semibold mb-2">Test 4: onClick only</p>
          <button 
            onClick={() => {
              console.log('Simple onClick fired');
              alert('Click worked!');
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Test if clicks work at all
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <p className="font-semibold">Check browser console for logs</p>
      </div>
    </div>
  );
}