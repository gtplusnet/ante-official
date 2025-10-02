'use client';

import { useState } from 'react';

export default function BareTest() {
  const [clicks, setClicks] = useState(0);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Bare Minimum Test - No Providers</h1>
      
      <p>Click count: {clicks}</p>
      
      <button 
        onClick={() => {
          console.log('Button clicked!');
          setClicks(c => c + 1);
        }}
        style={{ 
          padding: '10px 20px', 
          background: 'blue', 
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Click Me
      </button>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard" style={{ color: 'blue', textDecoration: 'underline' }}>
          Plain link to dashboard
        </a>
      </div>
      
      <script dangerouslySetInnerHTML={{ __html: `
        console.log('Inline script executed');
        window.addEventListener('DOMContentLoaded', () => {
          console.log('DOMContentLoaded fired');
        });
      `}} />
    </div>
  );
}