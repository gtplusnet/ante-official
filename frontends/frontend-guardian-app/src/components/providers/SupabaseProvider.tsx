'use client';

import React, { useEffect, ReactNode } from 'react';
import { getSupabaseService } from '@/lib/services/supabase.service';

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize Supabase service on mount
    const supabaseService = getSupabaseService();
    supabaseService.initialize();
    
    // Check for existing session
    const checkSession = async () => {
      const session = await supabaseService.getSession();
      if (session) {
        console.log('[SupabaseProvider] Existing session found');
      } else {
        console.log('[SupabaseProvider] No existing session');
      }
    };
    
    checkSession();
  }, []);

  return <>{children}</>;
};