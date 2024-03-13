const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

exports.getConnect = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const [email, password] = Buffer.from(authHeader.slice(6), 'base64').toString().split(':');

  const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
  const user = await dbClient.client.db().collection('users').findOne({ email, password: hashedPassword });
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = uuidv4();

  await redisClient.set(`auth_${token}`, user._id, 24 * 60 * 60);

  return res.status(200).json({ token });
};

exports.getDisconnect = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await redisClient.del(`auth_${token}`);
  res.status(204).send();
  return res.status(204).json({ token });
};
