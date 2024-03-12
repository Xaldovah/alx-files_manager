import { createHash } from 'crypto';
import dbClient from '../utils/db';
import { redisClient } from '../utils/redis';

export const postNew = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  const existingUser = await dbClient.collection('users').findOne({ email });

  if (existingUser) {
    return res.status(400).json({ error: 'Already exist' });
  }

  const hashedPassword = createHash('sha1').update(password).digest('hext');

  const newUser = {
    email,
    password: hashedPassword,
  };

  try {
    const { insertedId } = await dbClient.collection('users').insertOne(newUser);
    const createdUser = { id: insertedId, email };

    res.status(201).json(createdUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(200).json({ message: 'User creation successful' });
};

export const getMe = async (req, res) => {
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await dbClient.collection('users').findOne({ _id: userId });

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.status(200).json({ id: user._id, email: user.email });
  return res.status(200).end();
};
