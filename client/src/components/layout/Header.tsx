import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BellIcon, SearchIcon } from "@/components/ui/icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: Date;
}

const Header = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed);
      setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
    }

    // Listen for new notifications
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification: Notification = {
        id: Date.now(),
        ...event.detail,
        read: false,
        createdAt: new Date()
      };
      
      const updatedNotifications = [newNotification, ...notifications].slice(0, 50);
      setNotifications(updatedNotifications);
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('newNotification' as any, handleNewNotification);
    return () => window.removeEventListener('newNotification' as any, handleNewNotification);
  }, [notifications]);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  const userInitials = getInitials(user.fullName);

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
    setUnreadCount(0);
  };

  return (
    <header className="bg-neutral-800 border-b border-neutral-700 sticky top-0 z-20">
      <div className="flex justify-between items-center py-3 px-4">
        <div className="flex items-center">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search markets..." 
              className="bg-neutral-700 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-72" 
            />
            <SearchIcon className="absolute left-3 top-2.5 text-neutral-400 w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-neutral-700 rounded-md px-3 py-1.5">
            <span className="text-sm font-medium mr-2">Market Status:</span>
            <span className="flex items-center text-success">
              <span className="h-2 w-2 bg-success rounded-full mr-1.5 animate-pulse"></span>
              Open
            </span>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button className="relative text-neutral-400 hover:text-white">
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearNotifications}
                      className="text-xs text-neutral-500 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    <BellIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {!notification.read && (
                            <span className="h-2 w-2 bg-primary rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {notification.message}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Link href="/profile" className="flex items-center gap-2 cursor-pointer hover:bg-neutral-700 p-1.5 rounded-md">
            <Avatar className="h-8 w-8 bg-primary">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-neutral-400">{user.kycStatus === "verified" ? "Verified Trader" : "Pending Verification"}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
          {user.role === 'admin' && (
            <Link href="/admin" className="text-sm text-blue-500">
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;