import sha1 from 'sha1';
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';

const userQueue = new Queue('email sending');

export default class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    const user = await dbClient.users.findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }
    const hashedPassword = sha1(password);
    const newUser = await dbClient.users.insertOne({ email, password: hashedPassword });

    userQueue.add({ userId });
    res.status(201).json({ email, id: newUser.insertedId });
  }

  static async getMe(req, res) {
    const { user } = req;

    res.status(200).json({ email: user.email, id: user._id.toString() });
  }
}
