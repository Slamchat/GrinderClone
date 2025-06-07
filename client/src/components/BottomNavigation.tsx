import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, MessageCircle, Heart, User } from "lucide-react";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  unreadCount?: number;
}

export function BottomNavigation({ unreadCount = 0 }: BottomNavigationProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { 
      id: 'discover', 
      icon: Grid3X3, 
      label: 'Discover', 
      path: '/',
      active: location === '/' 
    },
    { 
      id: 'messages', 
      icon: MessageCircle, 
      label: 'Messages', 
      path: '/messages',
      active: location === '/messages',
      badge: unreadCount 
    },
    { 
      id: 'likes', 
      icon: Heart, 
      label: 'Likes', 
      path: '/likes',
      active: location === '/likes' 
    },
    { 
      id: 'profile', 
      icon: User, 
      label: 'Profile', 
      path: '/profile',
      active: location === '/profile' 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-surface border-t border-gray-800 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex flex-col items-center py-2 px-4 space-y-1 transition-colors ${
                item.active 
                  ? 'text-primary' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setLocation(item.path)}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center p-0">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
