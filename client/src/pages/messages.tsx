import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChatModal } from "@/components/ChatModal";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Search, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { MessageWithUsers } from "@shared/schema";

export default function Messages() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: isAuthenticated,
    retry: false,
  });

  const filteredConversations = conversations.filter((conv: MessageWithUsers) => {
    const otherUserName = conv.sender.firstName || conv.receiver.firstName || "";
    return otherUserName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleConversationClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowChat(true);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="bg-surface border-b border-gray-800 p-4">
          <h1 className="text-xl font-bold mb-4">Messages</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700"
            />
          </div>
        </header>

        {/* Conversations List */}
        <main className="pb-20">
          {conversationsLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-surface border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 animate-pulse">
                      <div className="w-12 h-12 bg-gray-700 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center p-8">
              <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-bold text-gray-300 mb-2">No conversations yet</h2>
              <p className="text-gray-400 text-sm">
                Start chatting with people you like to see conversations here
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredConversations.map((conversation: MessageWithUsers) => {
                const otherUser = conversation.sender.id !== conversation.senderId 
                  ? conversation.sender 
                  : conversation.receiver;
                
                return (
                  <Card 
                    key={conversation.id}
                    className="bg-surface border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => handleConversationClick(otherUser.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={otherUser.profileImageUrl || ""} />
                            <AvatarFallback className="bg-gray-700">
                              {(otherUser.firstName || otherUser.email || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online indicator */}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-white truncate">
                              {otherUser.firstName || otherUser.email?.split('@')[0] || 'User'}
                            </h3>
                            <span className="text-xs text-gray-400">
                              {formatTime(conversation.createdAt!)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-400 truncate">
                              {conversation.content}
                            </p>
                            {!conversation.isRead && (
                              <Badge className="bg-primary text-white text-xs px-2 py-1">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation />

        {/* Chat Modal */}
        <ChatModal
          open={showChat}
          onClose={() => setShowChat(false)}
          userId={selectedUserId}
        />
      </div>
    </div>
  );
}
