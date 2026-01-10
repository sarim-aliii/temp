import { createClient } from 'redis';
import Logger from '../utils/logger';


// 1. Initialize Client
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
});

redisClient.on('error', (err) => Logger.error('Redis Client Error', err));
redisClient.on('connect', () => Logger.info('✅ Redis Client Connected'));

// 2. Connect immediately
(async () => {
  if (process.env.REDIS_URL) {
    await redisClient.connect();
  }
})();

export default redisClient;