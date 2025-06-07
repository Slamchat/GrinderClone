import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProfileCard } from "@/components/ProfileCard";
import { FilterModal } from "@/components/FilterModal";
import { ProfileModal } from "@/components/ProfileModal";
import { ChatModal } from "@/components/ChatModal";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Settings, Bell, MapPin, Grid3X3, List, Zap, Rocket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import type { ProfileWithPhotos } from "@shared/schema";

interface Filters {
  ageMin: number;
  ageMax: number;
  maxDistance: number;
  onlineOnly: boolean;
}

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithPhotos | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [location, setLocation] = useState("Downtown LA");
  const [filters, setFilters] = useState<Filters>({
    ageMin: 18,
    ageMax: 35,
    maxDistance: 10,
    onlineOnly: false,
  });

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

  // Fetch nearby profiles
  const { data: profiles = [], isLoading: profilesLoading, refetch } = useQuery({
    queryKey: ['/api/discover', filters],
    enabled: isAuthenticated,
    retry: false,
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // You would typically reverse geocode these coordinates
          setLocation("Current Location");
        },
        (error) => {
          console.log("Location access denied");
        }
      );
    }
  }, []);

  const handleProfileClick = (profile: ProfileWithPhotos) => {
    setSelectedProfile(profile);
  };

  const handleSendMessage = (userId: string) => {
    setChatUserId(userId);
    setSelectedProfile(null);
    setShowChat(true);
  };

  const handleLike = async (userId: string) => {
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likedId: userId }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to like');

      const result = await response.json();
      
      if (result.isMatch) {
        toast({
          title: "It's a match! 🎉",
          description: "You can now start chatting",
        });
      } else {
        toast({
          title: "Like sent! ❤️",
          description: "They'll be notified",
        });
      }
    } catch (error) {
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
        description: "Failed to send like",
        variant: "destructive",
      });
    }
  };

  const handleBlock = async (userId: string) => {
    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: userId }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to block');

      toast({
        title: "User blocked",
        description: "They won't appear in your discovery anymore",
      });
      
      setSelectedProfile(null);
      refetch();
    } catch (error) {
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
        description: "Failed to block user",
        variant: "destructive",
      });
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
      <div className="max-w-md mx-auto relative">
        {/* Header */}
        <header className="bg-surface border-b border-gray-800 sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-white font-medium">{location}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pb-20">
          {/* Discovery Section */}
          <section className="p-4">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold">Discover</h1>
                <div className="flex space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-gray-400">{profiles.length} people nearby</p>
            </div>

            {/* Profiles Grid */}
            {profilesLoading ? (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-surface rounded-2xl aspect-square animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {profiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onClick={() => handleProfileClick(profile)}
                  />
                ))}
                
                {/* Load More Card */}
                <div className="bg-surface rounded-2xl aspect-square border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <div className="text-center text-gray-400">
                    <div className="text-2xl mb-2">+</div>
                    <div className="text-sm">Load More</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button className="bg-primary hover:bg-primary/90 py-6">
                <Zap className="w-5 h-5 mr-2" />
                Quick Match
              </Button>
              <Button variant="secondary" className="py-6">
                <Rocket className="w-5 h-5 mr-2" />
                Boost Profile
              </Button>
            </div>
          </section>
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation />

        {/* Modals */}
        <FilterModal
          open={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <ProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onSendMessage={(userId) => handleSendMessage(userId)}
          onLike={(userId) => handleLike(userId)}
          onBlock={(userId) => handleBlock(userId)}
        />

        <ChatModal
          open={showChat}
          onClose={() => setShowChat(false)}
          userId={chatUserId}
        />
      </div>
    </div>
  );
}
