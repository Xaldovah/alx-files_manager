import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export const getConnect = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const authEncoded = authHeader.split(' ')[1];
  const authDecoded = Buffer.from(authEncoded, 'base64').toString('utf-8');
  const [email, password] = authDecoded.split(':');

  if (!email || !password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const hashedPassword = createHash('sha1').update(password).digest('hex');

  const user = await dbClient.collection('users').findOne({ email, password: hashedPassword });

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = uuidv4();
  const key = `auth_${token}`;

  await redisClient.set(key, user._id.toString(), 86400);
  res.status(200).json({ token });
  return res.status(200).end();
};

export const getDisconnect = async (req, res) => {
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const key = `auth_${token}`;
  const userId = await redisClient.get(key);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await redisClient.del(key);

  return res.status(204).end();
};
