import { createClient } from 'redis';
import { config } from 'dotenv';

config();

// Create Redis client
const redisClient = createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis server connection refused.');
            return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            console.log('Redis retry time exhausted.');
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            console.log('Redis connection attempts exceeded.');
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

// Redis connection events
redisClient.on('connect', () => {
    console.log('Connected to Redis server');
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisClient.on('ready', () => {
    console.log('Redis client ready');
});

redisClient.on('end', () => {
    console.log('Redis connection ended');
});

// Connect to Redis
const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log('Redis connected successfully');
        return true;
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        // Don't exit the process, just log the error
        // The app can still work without Redis
        return false;
    }
};

// Check if Redis is connected
const isRedisConnected = () => {
    return redisClient && redisClient.isOpen;
};

// Redis utility functions
export const redisUtils = {
    // Set user session data
    setUserSession: async (userId, sessionData, expireInSeconds = 3600) => {
        try {
            if (!isRedisConnected()) {
                console.log('Redis not connected, skipping session storage');
                return false;
            }
            const key = `user:session:${userId}`;
            await redisClient.setEx(key, expireInSeconds, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            console.error('Error setting user session:', error);
            return false;
        }
    },

    // Get user session data
    getUserSession: async (userId) => {
        try {
            if (!isRedisConnected()) return null;
            const key = `user:session:${userId}`;
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting user session:', error);
            return null;
        }
    },

    // Delete user session
    deleteUserSession: async (userId) => {
        try {
            const key = `user:session:${userId}`;
            await redisClient.del(key);
            return true;
        } catch (error) {
            console.error('Error deleting user session:', error);
            return false;
        }
    },

    // Store user profile cache
    setUserProfile: async (username, profileData, expireInSeconds = 1800) => {
        try {
            const key = `user:profile:${username}`;
            await redisClient.setEx(key, expireInSeconds, JSON.stringify(profileData));
            return true;
        } catch (error) {
            console.error('Error caching user profile:', error);
            return false;
        }
    },

    // Get cached user profile
    getUserProfile: async (username) => {
        try {
            const key = `user:profile:${username}`;
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting cached user profile:', error);
            return null;
        }
    },

    // Store quiz session data
    setQuizSession: async (userId, quizData, expireInSeconds = 7200) => {
        try {
            const key = `quiz:session:${userId}`;
            await redisClient.setEx(key, expireInSeconds, JSON.stringify(quizData));
            return true;
        } catch (error) {
            console.error('Error setting quiz session:', error);
            return false;
        }
    },

    // Get quiz session data
    getQuizSession: async (userId) => {
        try {
            const key = `quiz:session:${userId}`;
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting quiz session:', error);
            return null;
        }
    },

    // Store user statistics cache
    setUserStats: async (username, stats, expireInSeconds = 900) => {
        try {
            const key = `user:stats:${username}`;
            await redisClient.setEx(key, expireInSeconds, JSON.stringify(stats));
            return true;
        } catch (error) {
            console.error('Error caching user stats:', error);
            return false;
        }
    },

    // Get cached user statistics
    getUserStats: async (username) => {
        try {
            const key = `user:stats:${username}`;
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting cached user stats:', error);
            return null;
        }
    },

    // Increment user activity counter
    incrementUserActivity: async (username) => {
        try {
            const key = `user:activity:${username}`;
            await redisClient.incr(key);
            await redisClient.expire(key, 86400); // Expire after 24 hours
            return true;
        } catch (error) {
            console.error('Error incrementing user activity:', error);
            return false;
        }
    },

    // Get all active users (for admin dashboard)
    getActiveUsers: async () => {
        try {
            const keys = await redisClient.keys('user:session:*');
            const activeUsers = [];
            
            for (const key of keys) {
                const sessionData = await redisClient.get(key);
                if (sessionData) {
                    const userId = key.split(':')[2];
                    activeUsers.push({
                        userId,
                        sessionData: JSON.parse(sessionData)
                    });
                }
            }
            
            return activeUsers;
        } catch (error) {
            console.error('Error getting active users:', error);
            return [];
        }
    }
};

export { redisClient, connectRedis };
export default redisClient;