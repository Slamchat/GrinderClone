import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, MessageCircle, Heart, Ban, MapPin, Share } from "lucide-react";
import type { ProfileWithPhotos } from "@shared/schema";

interface ProfileModalProps {
  profile: ProfileWithPhotos | null;
  onClose: () => void;
  onSendMessage: (userId: string) => void;
  onLike: (userId: string) => void;
  onBlock: (userId: string) => void;
}

export function ProfileModal({ profile, onClose, onSendMessage, onLike, onBlock }: ProfileModalProps) {
  if (!profile) return null;

  const primaryPhoto = profile.photos.find(p => p.isPrimary) || profile.photos[0];
  const distance = "0.5 mi"; // This would be calculated based on user's location

  const getOnlineStatus = () => {
    if (profile.isOnline) return { text: "Online now", color: "text-green-400" };
    
    const lastSeen = new Date(profile.lastSeen!);
    const now = new Date();
    const diffInHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return { text: "Active recently", color: "text-yellow-400" };
    if (diffInHours < 24) return { text: `${Math.floor(diffInHours)}h ago`, color: "text-gray-400" };
    return { text: "Offline", color: "text-gray-500" };
  };

  const onlineStatus = getOnlineStatus();

  return (
    <Dialog open={!!profile} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md h-full max-h-screen bg-black text-white p-0 border-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-surface/80 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                <Share className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Profile Photo */}
          <div className="relative flex-1">
            {primaryPhoto ? (
              <img 
                src={primaryPhoto.url} 
                alt={`${profile.displayName}'s photo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-6xl text-gray-400">
                  {profile.displayName[0]?.toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6">
              <div className="space-y-3">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    {profile.displayName}, {profile.age}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{distance} away</span>
                    </div>
                    <span>•</span>
                    <span className={onlineStatus.color}>{onlineStatus.text}</span>
                  </div>
                </div>
                
                {profile.bio && (
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-black p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {profile.height && (
                <Card className="bg-surface border-gray-800">
                  <CardContent className="p-4 text-center">
                    <div className="text-xl font-bold text-primary">{profile.height}</div>
                    <div className="text-sm text-gray-400">Height</div>
                  </CardContent>
                </Card>
              )}
              {profile.bodyType && (
                <Card className="bg-surface border-gray-800">
                  <CardContent className="p-4 text-center">
                    <div className="text-xl font-bold text-primary">{profile.bodyType}</div>
                    <div className="text-sm text-gray-400">Body Type</div>
                  </CardContent>
                </Card>
              )}
              {profile.lookingFor && (
                <Card className="bg-surface border-gray-800">
                  <CardContent className="p-4 text-center">
                    <div className="text-xl font-bold text-primary">{profile.lookingFor}</div>
                    <div className="text-sm text-gray-400">Looking For</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Photo Gallery */}
            {profile.photos.length > 1 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">More Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {profile.photos.slice(0, 6).map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt="Profile photo"
                      className="aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => onBlock(profile.userId)}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Ban className="w-4 h-4 mr-2" />
                Block
              </Button>
              <Button
                onClick={() => onLike(profile.userId)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Heart className="w-4 h-4 mr-2" />
                Like
              </Button>
              <Button
                onClick={() => onSendMessage(profile.userId)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
