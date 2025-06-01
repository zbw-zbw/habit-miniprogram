/**
 * 挑战相关类型定义
 */

interface IChallenge {
  id: string;
  _id?: string; // MongoDB ID
  name: string;
  description: string;
  coverImage?: string;
  type: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  privacy: 'public' | 'private';
  creator?: {
    _id: string;
    username?: string;
    nickname?: string;
    avatar?: string;
  };
  targetHabit?: {
    name: string;
    description: string;
    frequency?: {
      type: string;
      days: string[];
    };
  };
  requirements?: {
    targetCount: number;
    requireStreak: boolean;
    minStreakDays?: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  rewards?: {
    points: number;
    badges: string[];
  };
  maxParticipants: number;
  participantCount: number;
  participants?: number;
  participantsCount?: number;
  isOfficial: boolean;
  isFeatured: boolean;
  tags: string[];
  isJoined?: boolean;
  isParticipating?: boolean;
  participationStatus?: string;
  progress?: {
    completedCount: number;
    targetCount: number;
    completionRate: number;
    longestStreak?: number;
  };
  rules?: string;
  createdAt?: string;
  updatedAt?: string;
} 
