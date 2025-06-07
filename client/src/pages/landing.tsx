import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, MapPin, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="max-w-md mx-auto relative">
        {/* Hero Section */}
        <div className="relative h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Slam Chat
              </h1>
            </div>

            {/* Tagline */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">
                Connect & Discover
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Meet amazing people nearby and start meaningful conversations
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 my-8">
              <Card className="bg-surface border-gray-800">
                <CardContent className="p-4 text-center">
                  <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Location-based</p>
                </CardContent>
              </Card>
              <Card className="bg-surface border-gray-800">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Real connections</p>
                </CardContent>
              </Card>
              <Card className="bg-surface border-gray-800">
                <CardContent className="p-4 text-center">
                  <MessageCircle className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Instant messaging</p>
                </CardContent>
              </Card>
              <Card className="bg-surface border-gray-800">
                <CardContent className="p-4 text-center">
                  <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Match system</p>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 text-lg"
                size="lg"
              >
                Get Started
              </Button>
              <p className="text-xs text-gray-400">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
