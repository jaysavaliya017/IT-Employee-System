import { useState, useEffect, useRef } from 'react';
import { notificationApi } from '../api/services';
import { Notification } from '../types';
import { Bell, Check, CheckCheck, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    // Poll for unread count every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getAll({ limit: 5 });
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id, { stopPropagation: () => {} } as React.MouseEvent);
    }
    setIsOpen(false);

    // Navigate based on notification type
    if (notification.referenceType === 'SALARY_RECORD' && notification.referenceId) {
      navigate('/salary');
    } else if (notification.referenceType === 'LEAVE_REQUEST' && notification.referenceId) {
      navigate('/leave-history');
    } else if (notification.referenceType === 'ANNOUNCEMENT') {
      navigate('/announcements');
    } else if (notification.referenceType === 'GALLERY_IMAGE') {
      navigate('/gallery');
    } else {
      navigate('/notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SALARY_CREDITED':
      case 'SALARY_SLIP':
        return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">₹</div>;
      case 'LEAVE_APPROVED':
        return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">✓</div>;
      case 'LEAVE_REJECTED':
        return <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">✗</div>;
      case 'ANNOUNCEMENT':
        return <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">📢</div>;
      case 'GALLERY_IMAGE':
        return <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">📷</div>;
      case 'BIRTHDAY':
        return <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">🎂</div>;
      case 'WORK_ANNIVERSARY':
        return <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">🎉</div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">🔔</div>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Now';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${!notification.isRead ? 'bg-primary-50/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                        <span className="text-xs text-gray-400 ml-2">{formatTimeAgo(notification.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => markAsRead(notification.id, e)}
                        className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
