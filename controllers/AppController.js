import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export const getStatus = (req, res) => {
  const redisAlive = redisClient.isAlive();
  const dbAlive = dbClient.isAlive();

  res.status(200).json({ redis: redisAlive, db: dbAlive });
};

export const getStats = async (req, res) => {
  try {
    const numUsers = await dbClient.nbUsers();
    const numFiles = await dbClient.nbFiles();

    res.status(200).json({ users: numUsers, files: numFiles });
  } catch (error) {
    console.error('Error retrieving stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
