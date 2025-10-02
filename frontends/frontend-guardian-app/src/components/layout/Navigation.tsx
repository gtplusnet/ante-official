'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FiGrid, 
  FiFileText, 
  FiUsers, 
  FiSettings, 
  FiDollarSign,
  FiX,
  FiLogOut,
  FiUserPlus
} from 'react-icons/fi';
import { Guardian } from '@/types';

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
  guardian: Guardian;
}

export const Navigation: React.FC<NavigationProps> = ({ isOpen, onClose, guardian }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);


  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsAnimating(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid, path: '/dashboard' },
    { id: 'log-history', label: 'Log History', icon: FiFileText, path: '/log-history' },
    { id: 'student-info', label: 'Student Information', icon: FiUsers, path: '/students' },
    { id: 'account', label: 'Account Settings', icon: FiSettings, path: '/account' },
    { id: 'tuition', label: 'Tuition & Fees', icon: FiDollarSign, path: '/tuition' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-out Navigation */}
      <nav className={`
        fixed top-0 left-0 h-full w-72 bg-primary-500 text-white z-50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="pt-safe-top h-full flex flex-col">
          {/* Header */}
          <div className={`p-4 border-b border-primary-400 transition-all duration-500 ${isAnimating ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">MATER DEI ACADEMY</h2>
                <p className="text-xs text-primary-200">STUDENT ATTENDANCE LOG TRACKER</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg hover:bg-primary-600 transition-all duration-200 hover:rotate-90"
                aria-label="Close menu"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            {/* Guardian Info */}
            <div className={`flex items-center gap-3 transition-all duration-700 delay-100 ${isAnimating ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              <div className="w-12 h-12 bg-primary-300 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110">
                <span className="text-xl font-semibold">
                  {guardian.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="font-medium">{guardian.name}</p>
                <p className="text-xs text-primary-200">Student Guardian</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 py-4">
            <p className={`px-4 text-xs text-primary-200 uppercase tracking-wider mb-2 transition-all duration-500 delay-200 ${isAnimating ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              Menu
            </p>
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              // Handle both with and without trailing slashes
              const isActive = pathname === item.path || pathname === `${item.path}/` || pathname === item.path.replace(/\/$/, '');
              
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={onClose}
                  className={`w-full text-left
                    flex items-center gap-3 px-4 py-3 transition-all duration-300 relative
                    ${isActive 
                      ? 'bg-primary-600 text-white border-l-4 border-secondary-500 nav-active-glow' 
                      : 'text-primary-100 hover:bg-primary-600 hover:text-white hover:pl-6 border-l-4 border-transparent'
                    }
                    ${isAnimating ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}
                  `}
                  style={{
                    transitionDelay: isAnimating ? `${300 + (index * 50)}ms` : '0ms'
                  }}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-500 animate-pulse" />
                  )}
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-secondary-500' : ''}`} />
                  <span className={`${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className={`p-4 border-t border-primary-400 transition-all duration-700 delay-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link 
              href="/add-student"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-secondary-500 text-gray-900 px-4 py-3 rounded-lg font-medium hover:bg-secondary-600 transition-all duration-200 mb-3 hover:scale-105 active:scale-95"
            >
              <FiUserPlus className="w-5 h-5 transition-transform duration-200 hover:rotate-12" />
              Add Student
            </Link>
            <Link 
              href="/login"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 text-primary-100 hover:text-white transition-all duration-200 hover:scale-105"
            >
              <FiLogOut className="w-5 h-5 transition-transform duration-200 hover:-translate-x-1" />
              Logout
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
};