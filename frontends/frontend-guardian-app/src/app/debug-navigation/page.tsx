'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DebugNavigation() {
  const router = useRouter();
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testProgrammaticNav = (path: string) => {
    addLog(`Attempting programmatic navigation to ${path}`);
    try {
      router.push(path);
      addLog(`router.push(${path}) called successfully`);
    } catch (error) {
      addLog(`Error: ${error}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Navigation Debug Page</h1>
      
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          This page bypasses authentication to test if navigation is working at all.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Link Component Tests */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Next.js Link Component:</h2>
          <div className="space-y-2">
            <Link 
              href="/dashboard" 
              className="block p-3 bg-blue-100 hover:bg-blue-200 rounded"
              onClick={() => addLog('Link clicked: /dashboard')}
            >
              Link to Dashboard →
            </Link>
            <Link 
              href="/students" 
              className="block p-3 bg-blue-100 hover:bg-blue-200 rounded"
              onClick={() => addLog('Link clicked: /students')}
            >
              Link to Students →
            </Link>
            <Link 
              href="/login" 
              className="block p-3 bg-blue-100 hover:bg-blue-200 rounded"
              onClick={() => addLog('Link clicked: /login')}
            >
              Link to Login (unprotected) →
            </Link>
          </div>
        </section>

        {/* Programmatic Navigation Tests */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Programmatic Navigation (router.push):</h2>
          <div className="space-y-2">
            <button
              onClick={() => testProgrammaticNav('/dashboard')}
              className="block w-full p-3 bg-green-100 hover:bg-green-200 rounded text-left"
            >
              router.push('/dashboard') →
            </button>
            <button
              onClick={() => testProgrammaticNav('/students')}
              className="block w-full p-3 bg-green-100 hover:bg-green-200 rounded text-left"
            >
              router.push('/students') →
            </button>
            <button
              onClick={() => testProgrammaticNav('/login')}
              className="block w-full p-3 bg-green-100 hover:bg-green-200 rounded text-left"
            >
              router.push('/login') →
            </button>
          </div>
        </section>

        {/* Plain HTML Navigation */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Plain HTML Anchors:</h2>
          <div className="space-y-2">
            <a 
              href="/dashboard" 
              className="block p-3 bg-purple-100 hover:bg-purple-200 rounded"
              onClick={() => addLog('Anchor clicked: /dashboard')}
            >
              Anchor to Dashboard →
            </a>
            <a 
              href="/students" 
              className="block p-3 bg-purple-100 hover:bg-purple-200 rounded"
              onClick={() => addLog('Anchor clicked: /students')}
            >
              Anchor to Students →
            </a>
          </div>
        </section>

        {/* Window.location Tests */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Window.location Navigation:</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                addLog('Using window.location.href = /dashboard');
                window.location.href = '/dashboard';
              }}
              className="block w-full p-3 bg-orange-100 hover:bg-orange-200 rounded text-left"
            >
              window.location.href = '/dashboard' →
            </button>
          </div>
        </section>

        {/* Event Log */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Event Log:</h2>
          <div className="bg-gray-100 p-4 rounded h-48 overflow-y-auto">
            {log.length === 0 ? (
              <p className="text-gray-500">No events yet. Click something above.</p>
            ) : (
              <pre className="text-xs">{log.join('\n')}</pre>
            )}
          </div>
          <button
            onClick={() => setLog([])}
            className="mt-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Log
          </button>
        </section>
      </div>
    </div>
  );
}