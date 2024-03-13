const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

exports.getMe = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await dbClient.client.db().collection('users').findOne({ userId });
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ id: user._id, email: user.email });
  return res.status(200);
};
