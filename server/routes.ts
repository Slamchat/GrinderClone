import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertProfileSchema, 
  insertMessageSchema, 
  insertLikeSchema,
  insertBlockSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileWithPhotos(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertProfileSchema.parse({
        ...req.body,
        userId,
      });

      const existingProfile = await storage.getProfile(userId);
      
      let profile;
      if (existingProfile) {
        profile = await storage.updateProfile(userId, profileData);
      } else {
        profile = await storage.createProfile(profileData);
      }

      res.json(profile);
    } catch (error) {
      console.error("Error creating/updating profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  // Discovery routes
  app.get('/api/discover', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const {
        latitude,
        longitude,
        maxDistance = 50,
        ageMin = 18,
        ageMax = 65,
        onlineOnly = false
      } = req.query;

      const profiles = await storage.getNearbyProfiles(
        userId,
        latitude ? parseFloat(latitude as string) : undefined,
        longitude ? parseFloat(longitude as string) : undefined,
        parseInt(maxDistance as string),
        parseInt(ageMin as string),
        parseInt(ageMax as string),
        onlineOnly === 'true'
      );

      res.json(profiles);
    } catch (error) {
      console.error("Error fetching nearby profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  // Messaging routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversation/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.params;
      const messages = await storage.getConversation(userId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });

      const message = await storage.sendMessage(messageData);
      
      // Broadcast to WebSocket clients
      const messageWithSender = {
        ...message,
        senderId: userId,
      };
      
      // Find WebSocket connection for receiver and send message
      wss.clients.forEach((client: any) => {
        if (client.readyState === WebSocket.OPEN && 
            (client.userId === messageData.receiverId || client.userId === userId)) {
          client.send(JSON.stringify({
            type: 'new_message',
            data: messageWithSender
          }));
        }
      });

      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Likes routes
  app.post('/api/likes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const likeData = insertLikeSchema.parse({
        ...req.body,
        likerId: userId,
      });

      const like = await storage.addLike(likeData);
      
      // Check for mutual like
      const mutualLikes = await storage.getMutualLikes(userId);
      const isMatch = mutualLikes.includes(likeData.likedId);

      res.json({ like, isMatch });
    } catch (error) {
      console.error("Error adding like:", error);
      res.status(500).json({ message: "Failed to add like" });
    }
  });

  app.delete('/api/likes/:likedId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { likedId } = req.params;
      
      await storage.removeLike(userId, likedId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing like:", error);
      res.status(500).json({ message: "Failed to remove like" });
    }
  });

  app.get('/api/likes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const likes = await storage.getLikes(userId);
      res.json(likes);
    } catch (error) {
      console.error("Error fetching likes:", error);
      res.status(500).json({ message: "Failed to fetch likes" });
    }
  });

  // Block routes
  app.post('/api/blocks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const blockData = insertBlockSchema.parse({
        ...req.body,
        blockerId: userId,
      });

      const block = await storage.addBlock(blockData);
      res.json(block);
    } catch (error) {
      console.error("Error adding block:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  // Online status route
  app.post('/api/online-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isOnline } = req.body;
      
      await storage.updateOnlineStatus(userId, isOnline);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating online status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  wss.on('connection', (ws: any, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth') {
          // Authenticate WebSocket connection
          ws.userId = data.userId;
          
          // Update online status
          await storage.updateOnlineStatus(data.userId, true);
          
          console.log(`User ${data.userId} authenticated via WebSocket`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (ws.userId) {
        await storage.updateOnlineStatus(ws.userId, false);
        console.log(`User ${ws.userId} disconnected`);
      }
    });
  });

  return httpServer;
}
