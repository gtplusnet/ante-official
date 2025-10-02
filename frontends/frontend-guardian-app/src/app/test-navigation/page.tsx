'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TestNavigation() {
  const router = useRouter();

  const handleProgrammaticNav = () => {
    console.log('Programmatic navigation to dashboard');
    router.push('/dashboard');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Navigation Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Link Component Navigation:</h2>
          <div className="space-x-4">
            <Link href="/dashboard" className="text-blue-500 underline">
              Go to Dashboard (Link)
            </Link>
            <Link href="/students" className="text-blue-500 underline">
              Go to Students (Link)
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Programmatic Navigation:</h2>
          <button
            onClick={handleProgrammaticNav}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go to Dashboard (Router)
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Plain HTML Navigation:</h2>
          <a href="/dashboard" className="text-green-500 underline">
            Go to Dashboard (Anchor)
          </a>
        </div>
      </div>
    </div>
  );
}