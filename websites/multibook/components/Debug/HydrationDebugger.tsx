'use client';

import { useEffect, useState } from 'react';

interface HydrationDebuggerProps {
  data: any;
  label: string;
}

export default function HydrationDebugger({ data, label }: HydrationDebuggerProps) {
  const [clientData, setClientData] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setClientData(data);
    setIsHydrated(true);
    console.log(`🔍 Hydration Debug [${label}]:`, {
      serverData: data,
      isHydrated: true,
      dataType: typeof data,
      isArray: Array.isArray(data),
      dataLength: data?.length || 0,
      firstItem: data?.[0] || null
    });
  }, [data, label]);

  if (!isHydrated) {
    return (
      <div style={{
        background: '#f0f0f0', 
        padding: '10px', 
        margin: '10px 0', 
        border: '2px solid #ccc',
        fontSize: '12px'
      }}>
        <strong>SERVER [{label}]:</strong> {JSON.stringify(data).substring(0, 100)}...
        <br />
        <strong>Length:</strong> {data?.length || 0}
      </div>
    );
  }

  return (
    <div style={{
      background: '#e8f5e8', 
      padding: '10px', 
      margin: '10px 0', 
      border: '2px solid #4caf50',
      fontSize: '12px'
    }}>
      <strong>CLIENT [{label}]:</strong> {JSON.stringify(clientData).substring(0, 100)}...
      <br />
      <strong>Length:</strong> {clientData?.length || 0}
      <br />
      <strong>Hydrated:</strong> {isHydrated ? '✅' : '❌'}
    </div>
  );
}