const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

exports.postUpload = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const localPath = path.join(folderPath, uuidv4());
    fs.mkdirSync(folderPath, { recursive: true });
    if (req.body.type !== 'folder') {
      fs.writeFileSync(localPath, Buffer.from(req.body.data, 'base64'));
    }
    const file = {
      userId,
      name: req.body.name,
      type: req.body.type,
      isPublic: req.body.isPublic || false,
      parentId: req.body.parentId || 0,
      localPath: req.body.type !== 'folder' ? localPath : null,
    };
    const result = await dbClient.client.db().collection('files').insertOne(file);
    const createdFile = { id: result.insertedId, ...file };
    res.status(201).json(createdFile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(200).end();
};


exports.getShow = async (req, res) => {
	try {
		const token = req.headers['x-token'];
		const userId = await redisClient.get(`auth_${token}`);
		if (!userId) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		const file = await dbClient.client.db().collection('files').findOne({
			_id: ObjectId(req.params.id),
			userId: userId
		});

		if (!file) {
			return res.status(404).json({ error: 'File not found' });
		}

		res.json(file);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal server error' });
	}
	return res.status(200).end();
};


exports.getIndex = async (req, res) => {
	try {
		const token = req.headers['x-token'];
		const userId = await redisClient.get(`auth_${token}`);
		if (!userId) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		const parentId = req.query.parentId || 0;
		const page = Number(req.query.page) || 0;
		const files = await dbClient.client.db().collection('files').aggregate([
			{
				$match: {
					userId: userId,
					parentId: parentId
				}
			},
			{
				$skip: 20 * page
			},
			{
				$limit: 20
			}
		]);
		res.json(files);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal server error' });
	}
};
