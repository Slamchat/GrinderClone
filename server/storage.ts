import {
  users,
  profiles,
  photos,
  messages,
  likes,
  blocks,
  type User,
  type UpsertUser,
  type Profile,
  type InsertProfile,
  type Photo,
  type InsertPhoto,
  type Message,
  type InsertMessage,
  type Like,
  type InsertLike,
  type Block,
  type InsertBlock,
  type UserWithProfile,
  type MessageWithUsers,
  type ProfileWithPhotos,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, desc, asc, ne, notInArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  getProfileWithPhotos(userId: string): Promise<ProfileWithPhotos | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile>;
  
  // Discovery operations
  getNearbyProfiles(
    userId: string,
    latitude?: number,
    longitude?: number,
    maxDistance?: number,
    ageMin?: number,
    ageMax?: number,
    onlineOnly?: boolean
  ): Promise<ProfileWithPhotos[]>;
  
  // Photo operations
  addPhoto(photo: InsertPhoto): Promise<Photo>;
  removePhoto(photoId: number, userId: string): Promise<void>;
  setPrimaryPhoto(photoId: number, userId: string): Promise<void>;
  
  // Messaging operations
  sendMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: string, userId2: string): Promise<MessageWithUsers[]>;
  getConversations(userId: string): Promise<MessageWithUsers[]>;
  markMessageAsRead(messageId: number, userId: string): Promise<void>;
  
  // Like operations
  addLike(like: InsertLike): Promise<Like>;
  removeLike(likerId: string, likedId: string): Promise<void>;
  getLikes(userId: string): Promise<Like[]>;
  getMutualLikes(userId: string): Promise<string[]>;
  
  // Block operations
  addBlock(block: InsertBlock): Promise<Block>;
  removeBlock(blockerId: string, blockedId: string): Promise<void>;
  getBlocks(userId: string): Promise<Block[]>;
  
  // Utility operations
  updateOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async getProfileWithPhotos(userId: string): Promise<ProfileWithPhotos | undefined> {
    const result = await db
      .select()
      .from(profiles)
      .leftJoin(photos, eq(photos.profileId, profiles.id))
      .leftJoin(users, eq(users.id, profiles.userId))
      .where(eq(profiles.userId, userId));

    if (result.length === 0) return undefined;

    const profile = result[0].profiles;
    const user = result[0].users!;
    const profilePhotos = result
      .map(r => r.photos)
      .filter(Boolean)
      .sort((a, b) => (a!.order || 0) - (b!.order || 0));

    return {
      ...profile,
      photos: profilePhotos as Photo[],
      user,
    };
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db
      .insert(profiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateProfile(userId: string, profileData: Partial<InsertProfile>): Promise<Profile> {
    const [profile] = await db
      .update(profiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  // Discovery operations
  async getNearbyProfiles(
    userId: string,
    latitude?: number,
    longitude?: number,
    maxDistance = 50,
    ageMin = 18,
    ageMax = 65,
    onlineOnly = false
  ): Promise<ProfileWithPhotos[]> {
    const result = await db
      .select()
      .from(profiles)
      .leftJoin(photos, eq(photos.profileId, profiles.id))
      .leftJoin(users, eq(users.id, profiles.userId))
      .where(
        and(
          ne(profiles.userId, userId),
          eq(profiles.isVisible, true),
          sql`${profiles.age} BETWEEN ${ageMin} AND ${ageMax}`,
          onlineOnly ? eq(profiles.isOnline, true) : undefined
        )
      )
      .orderBy(
        sql`
          CASE WHEN ${profiles.isOnline} = true THEN 0 ELSE 1 END,
          ${profiles.lastSeen} DESC
        `
      );

    // Group by profile
    const profileMap = new Map<number, ProfileWithPhotos>();
    
    for (const row of result) {
      const profile = row.profiles;
      const user = row.users!;
      const photo = row.photos;

      if (!profileMap.has(profile.id)) {
        profileMap.set(profile.id, {
          ...profile,
          photos: [],
          user,
        });
      }

      if (photo) {
        profileMap.get(profile.id)!.photos.push(photo);
      }
    }

    // Sort photos by order
    const profilesArray = Array.from(profileMap.values());
    for (const profile of profilesArray) {
      profile.photos.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    }

    return profilesArray;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  // Photo operations
  async addPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db
      .insert(photos)
      .values(photo)
      .returning();
    return newPhoto;
  }

  async removePhoto(photoId: number, userId: string): Promise<void> {
    await db
      .delete(photos)
      .where(
        and(
          eq(photos.id, photoId),
          eq(photos.profileId, 
            db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1)
          )
        )
      );
  }

  async setPrimaryPhoto(photoId: number, userId: string): Promise<void> {
    const userProfile = await this.getProfile(userId);
    if (!userProfile) throw new Error("Profile not found");

    // Remove primary flag from all photos
    await db
      .update(photos)
      .set({ isPrimary: false })
      .where(eq(photos.profileId, userProfile.id));

    // Set new primary photo
    await db
      .update(photos)
      .set({ isPrimary: true })
      .where(eq(photos.id, photoId));
  }

  // Messaging operations
  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getConversation(userId1: string, userId2: string): Promise<MessageWithUsers[]> {
    const result = await db
      .select()
      .from(messages)
      .leftJoin(users, eq(users.id, messages.senderId))
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(asc(messages.createdAt));

    return result.map(row => ({
      ...row.messages,
      sender: row.users!,
      receiver: row.users!, // This would need a second join in a real implementation
    }));
  }

  async getConversations(userId: string): Promise<MessageWithUsers[]> {
    // Get latest message from each conversation
    const latestMessages = await db
      .select()
      .from(messages)
      .leftJoin(users, eq(users.id, messages.senderId))
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));

    // Group by conversation and get only the latest message
    const conversationMap = new Map<string, MessageWithUsers>();
    
    for (const row of latestMessages) {
      const message = row.messages;
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          ...message,
          sender: row.users!,
          receiver: row.users!, // This would need proper joining
        });
      }
    }

    return Array.from(conversationMap.values());
  }

  async markMessageAsRead(messageId: number, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.receiverId, userId)
        )
      );
  }

  // Like operations
  async addLike(like: InsertLike): Promise<Like> {
    const [newLike] = await db
      .insert(likes)
      .values(like)
      .returning();
    return newLike;
  }

  async removeLike(likerId: string, likedId: string): Promise<void> {
    await db
      .delete(likes)
      .where(
        and(
          eq(likes.likerId, likerId),
          eq(likes.likedId, likedId)
        )
      );
  }

  async getLikes(userId: string): Promise<Like[]> {
    return await db
      .select()
      .from(likes)
      .where(eq(likes.likedId, userId))
      .orderBy(desc(likes.createdAt));
  }

  async getMutualLikes(userId: string): Promise<string[]> {
    const result = await db
      .select({ otherUserId: likes.likedId })
      .from(likes)
      .where(
        and(
          eq(likes.likerId, userId),
          sql`EXISTS (
            SELECT 1 FROM ${likes} l2 
            WHERE l2.liker_id = ${likes.likedId} 
            AND l2.liked_id = ${likes.likerId}
          )`
        )
      );

    return result.map(r => r.otherUserId);
  }

  // Block operations
  async addBlock(block: InsertBlock): Promise<Block> {
    const [newBlock] = await db
      .insert(blocks)
      .values(block)
      .returning();
    return newBlock;
  }

  async removeBlock(blockerId: string, blockedId: string): Promise<void> {
    await db
      .delete(blocks)
      .where(
        and(
          eq(blocks.blockerId, blockerId),
          eq(blocks.blockedId, blockedId)
        )
      );
  }

  async getBlocks(userId: string): Promise<Block[]> {
    return await db
      .select()
      .from(blocks)
      .where(eq(blocks.blockerId, userId));
  }

  // Utility operations
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db
      .update(profiles)
      .set({ 
        isOnline, 
        lastSeen: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(profiles.userId, userId));
  }
}

export const storage = new DatabaseStorage();
