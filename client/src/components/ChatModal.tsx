import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Send, Camera, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { MessageWithUsers } from "@shared/schema";

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

export function ChatModal({ open, onClose, userId }: ChatModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch conversation messages
  const { data: messages = [], refetch } = useQuery<MessageWithUsers[]>({
    queryKey: ['/api/conversation', userId],
    enabled: open && !!userId,
    retry: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest('POST', '/api/messages', {
        receiverId: userId,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversation', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setMessageText("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // WebSocket connection for real-time messages
  useEffect(() => {
    if (open && userId && user) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          userId: (user as any)?.id
        }));
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && 
            (data.data.senderId === userId || data.data.receiverId === userId)) {
          refetch();
        }
      };

      return () => {
        wsRef.current?.close();
      };
    }
  }, [open, userId, user, refetch]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && userId) {
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get other user info from first message
  const otherUser = messages.length > 0 
    ? messages[0].sender.id === user?.id 
      ? messages[0].receiver 
      : messages[0].sender
    : null;

  if (!open || !userId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md h-full max-h-screen bg-black text-white p-0 border-0">
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="bg-surface border-b border-gray-800 p-4 flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {otherUser && (
              <>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={otherUser.profileImageUrl || ""} />
                  <AvatarFallback className="bg-gray-700">
                    {(otherUser.firstName || otherUser.email || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {otherUser.firstName || otherUser.email?.split('@')[0] || 'User'}
                  </h3>
                  <p className="text-xs text-green-400">Online now</p>
                </div>
              </>
            )}
            
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <p>Start the conversation!</p>
              </div>
            ) : (
              messages.map((message: MessageWithUsers, index: number) => {
                const isOwn = message.senderId === user?.id;
                const showTime = index === 0 || 
                  new Date(message.createdAt!).getTime() - new Date(messages[index - 1].createdAt!).getTime() > 300000; // 5 minutes
                
                return (
                  <div key={message.id}>
                    {showTime && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {formatTime(message.createdAt!)}
                      </div>
                    )}
                    
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && (
                        <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
                          <AvatarImage src={message.sender.profileImageUrl || ""} />
                          <AvatarFallback className="bg-gray-700 text-xs">
                            {(message.sender.firstName || message.sender.email || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-xs px-4 py-3 rounded-2xl ${
                        isOwn 
                          ? 'bg-primary text-white rounded-tr-md' 
                          : 'bg-surface text-white rounded-tl-md'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-surface border-t border-gray-800 p-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" type="button">
                <Camera className="w-5 h-5" />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-gray-800 border-gray-700 pr-12"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
