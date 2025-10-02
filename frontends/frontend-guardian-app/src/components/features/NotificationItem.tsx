import React, { useState } from 'react';
import { Notification } from '@/types';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';
import { FiCalendar, FiUser, FiCheck, FiClock, FiTrash2 } from 'react-icons/fi';
import { useInAppNotifications } from '@/contexts/InAppNotificationContext';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { markAsRead, deleteNotification } = useInAppNotifications();
  const router = useRouter();

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.read || isLoading) return;

    setIsLoading(true);
    try {
      await markAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await deleteNotification(notification.id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async () => {
    // Mark as read if not already
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate based on notification type or action URL
    if (notification.actionUrl) {
      // If actionUrl is an external link, open in same window
      if (notification.actionUrl.startsWith('http')) {
        window.location.href = notification.actionUrl;
      } else {
        // Internal navigation
        router.push(notification.actionUrl);
      }
    } else {
      // Default navigation based on notification type
      switch (notification.type) {
        case 'attendance':
          if (notification.studentId) {
            router.push('/log-history');
          } else {
            router.push('/dashboard');
          }
          break;
        case 'payment':
          if (notification.studentId) {
            router.push(`/tuition/${notification.studentId}`);
          } else {
            router.push('/tuition');
          }
          break;
        case 'emergency':
        case 'announcement':
        case 'general':
        default:
          // Stay on notifications page or go to dashboard
          router.push('/dashboard');
          break;
      }
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'attendance':
        return <FiUser className="w-5 h-5 text-white" />;
      case 'payment':
        return <FiCalendar className="w-5 h-5 text-white" />;
      case 'emergency':
        return <FiClock className="w-5 h-5 text-white" />;
      case 'announcement':
        return <FiCheck className="w-5 h-5 text-white" />;
      default:
        return <FiUser className="w-5 h-5 text-white" />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'attendance':
        return 'bg-blue-500';
      case 'payment':
        return 'bg-secondary-500';
      case 'emergency':
        return 'bg-red-500';
      case 'announcement':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const cardBaseClasses = `transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer relative ${
    notification.read ? 'opacity-75' : ''
  }`;
  
  const cardTypeClasses = notification.type === 'payment' 
    ? "bg-secondary-50 border border-secondary-200" 
    : notification.read 
      ? "bg-gray-50 border border-gray-200" 
      : "bg-white border border-gray-200 shadow-sm";

  return (
    <Card 
      className={`${cardBaseClasses} ${cardTypeClasses}`} 
      interactive
      onClick={handleNotificationClick}
    >
      <div className="flex items-start gap-3">
        {/* Unread Indicator */}
        {!notification.read && (
          <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
        
        {/* Notification Icon */}
        <div className={`w-10 h-10 ${getNotificationColor()} rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:rotate-12`}>
          {notification.studentName && notification.type === 'attendance' ? (
            <span className="text-white text-sm font-medium">
              {notification.studentName.split(' ').map(n => n[0]).join('')}
            </span>
          ) : (
            getNotificationIcon()
          )}
        </div>
        
        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                {notification.message}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-gray-500">
                  {format(notification.timestamp, 'MMM d, yyyy · h:mm a')}
                </p>
                
                {notification.priority === 'high' && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                    High Priority
                  </span>
                )}
                
                {notification.studentName && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {notification.studentName}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-2">
              {!notification.read && (
                <button
                  onClick={handleMarkAsRead}
                  disabled={isLoading}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Mark as read"
                >
                  <FiCheck className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete notification"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Action Button */}
          {notification.actionUrl && notification.actionText && (
            <div className="mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (notification.actionUrl) {
                    // If actionUrl is an external link, open in same window
                    if (notification.actionUrl.startsWith('http')) {
                      window.location.href = notification.actionUrl;
                    } else {
                      // Internal navigation
                      router.push(notification.actionUrl);
                    }
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {notification.actionText} →
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};