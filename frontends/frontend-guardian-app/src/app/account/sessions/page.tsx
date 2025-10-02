'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FiSmartphone, 
  FiMonitor,
  FiTablet,
  FiMapPin,
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { format } from 'date-fns';

interface Session {
  id: string;
  device: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
  isActive: boolean;
}

const mockSessions: Session[] = [
  {
    id: '1',
    device: 'iPhone 14 Pro',
    deviceType: 'mobile',
    browser: 'Geer Guardian App',
    location: 'Santa Maria, Bulacan',
    ipAddress: '120.29.xxx.xxx',
    lastActive: new Date(),
    isCurrent: true,
    isActive: true,
  },
  {
    id: '2',
    device: 'Samsung Galaxy S23',
    deviceType: 'mobile',
    browser: 'Geer Guardian App',
    location: 'Quezon City, Manila',
    ipAddress: '112.198.xxx.xxx',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isCurrent: false,
    isActive: true,
  },
  {
    id: '3',
    device: 'iPad Pro',
    deviceType: 'tablet',
    browser: 'Safari',
    location: 'Makati, Manila',
    ipAddress: '112.207.xxx.xxx',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    isCurrent: false,
    isActive: false,
  },
];

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [showEndAllConfirm, setShowEndAllConfirm] = useState(false);
  const [endingSession, setEndingSession] = useState<string | null>(null);

  const getDeviceIcon = (deviceType: Session['deviceType']) => {
    switch (deviceType) {
      case 'mobile':
        return FiSmartphone;
      case 'tablet':
        return FiTablet;
      case 'desktop':
        return FiMonitor;
    }
  };

  const getActivityStatus = (lastActive: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastActive.getTime()) / 1000 / 60);
    
    if (diffInMinutes < 5) return { text: 'Active now', color: 'text-green-600' };
    if (diffInMinutes < 60) return { text: `${diffInMinutes} minutes ago`, color: 'text-gray-600' };
    if (diffInMinutes < 1440) return { text: `${Math.floor(diffInMinutes / 60)} hours ago`, color: 'text-gray-600' };
    return { text: format(lastActive, 'MMM d, yyyy'), color: 'text-gray-500' };
  };

  const handleEndSession = async (sessionId: string) => {
    setEndingSession(sessionId);
    
    // Simulate API call
    setTimeout(() => {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setEndingSession(null);
    }, 1000);
  };

  const handleEndAllSessions = async () => {
    // Simulate API call
    setTimeout(() => {
      setSessions(prev => prev.filter(s => s.isCurrent));
      setShowEndAllConfirm(false);
      router.push('/login');
    }, 1000);
  };

  const activeSessions = sessions.filter(s => !s.isCurrent);

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Active Sessions" 
        showMenu={false}
        showNotification={false}
        showBackButton={true}
      />

      <div className="px-4 py-4">
        {/* Security Notice */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Security Check</h4>
              <p className="text-sm text-blue-800">
                Review your active sessions regularly. If you see any unfamiliar devices or locations, 
                end those sessions immediately and change your password.
              </p>
            </div>
          </div>
        </Card>

        {/* Current Session */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Current Session
          </h3>
          {sessions.filter(s => s.isCurrent).map(session => {
            const Icon = getDeviceIcon(session.deviceType);
            const status = getActivityStatus(session.lastActive);
            
            return (
              <Card key={session.id} className="border-2 border-primary-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{session.device}</h4>
                        <p className="text-sm text-gray-500">{session.browser}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCheck className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600">This device</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiMapPin className="w-4 h-4" />
                        <span>{session.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4 text-gray-400" />
                        <span className={status.color}>{status.text}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        IP: {session.ipAddress}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Other Sessions */}
        {activeSessions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Other Sessions
              </h3>
              <button
                onClick={() => setShowEndAllConfirm(true)}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                End all
              </button>
            </div>
            
            <div className="space-y-3">
              {activeSessions.map(session => {
                const Icon = getDeviceIcon(session.deviceType);
                const status = getActivityStatus(session.lastActive);
                
                return (
                  <Card key={session.id} className={!session.isActive ? 'opacity-75' : ''}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${session.isActive ? 'bg-gray-100' : 'bg-gray-50'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${session.isActive ? 'text-gray-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{session.device}</h4>
                            <p className="text-sm text-gray-500">{session.browser}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEndSession(session.id)}
                            loading={endingSession === session.id}
                            disabled={endingSession === session.id}
                            className="!text-red-600 hover:!bg-red-50"
                          >
                            End
                          </Button>
                        </div>
                        
                        <div className="mt-3 space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FiMapPin className="w-4 h-4" />
                            <span>{session.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiClock className="w-4 h-4 text-gray-400" />
                            <span className={status.color}>{status.text}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            IP: {session.ipAddress}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* No Other Sessions */}
        {activeSessions.length === 0 && (
          <Card className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCheck className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No other active sessions</p>
            <p className="text-sm text-gray-400 mt-1">You're only logged in on this device</p>
          </Card>
        )}
      </div>

      {/* End All Sessions Confirmation */}
      {showEndAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiX className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">End All Sessions?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will log you out from all devices except this one. You'll need to log in again on other devices.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowEndAllConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEndAllSessions}
                  className="flex-1 !bg-red-600 hover:!bg-red-700"
                >
                  End All
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </MobileLayout>
  );
}