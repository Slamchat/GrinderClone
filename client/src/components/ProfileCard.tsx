import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import type { ProfileWithPhotos } from "@shared/schema";

interface ProfileCardProps {
  profile: ProfileWithPhotos;
  onClick: () => void;
}

export function ProfileCard({ profile, onClick }: ProfileCardProps) {
  const primaryPhoto = profile.photos.find(p => p.isPrimary) || profile.photos[0];
  const distance = "0.5 mi"; // This would be calculated based on user's location

  const getOnlineStatusColor = () => {
    if (profile.isOnline) return "bg-green-500";
    
    const lastSeen = new Date(profile.lastSeen!);
    const now = new Date();
    const diffInHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getOnlineStatusText = () => {
    if (profile.isOnline) return "Online now";
    
    const lastSeen = new Date(profile.lastSeen!);
    const now = new Date();
    const diffInHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "Active recently";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return "Offline";
  };

  return (
    <div 
      className="bg-surface rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 relative"
      onClick={onClick}
    >
      <div className="relative aspect-square">
        {primaryPhoto ? (
          <img 
            src={primaryPhoto.url} 
            alt={`${profile.displayName}'s photo`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <span className="text-4xl text-gray-400">
              {profile.displayName[0]?.toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Online status indicator */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white ${getOnlineStatusColor()}`} />
        
        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="text-white">
            <div className="font-semibold text-sm">
              {profile.displayName}, {profile.age}
            </div>
            <div className="flex items-center text-xs text-gray-300 mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{distance}</span>
            </div>
          </div>
        </div>

        {/* Looking for badge */}
        {profile.lookingFor && (
          <Badge 
            className="absolute top-2 left-2 text-xs bg-primary/80 text-white"
            variant="secondary"
          >
            {profile.lookingFor}
          </Badge>
        )}
      </div>
    </div>
  );
}
