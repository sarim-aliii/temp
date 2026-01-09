import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import Post from '../models/Post';
import { IUser } from '../models/User';
import Logger from '../utils/logger';

const router = Router();

// GET /api/posts - Get all posts for the feed
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name avatar handle')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (error) {
    Logger.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts - Create a new post
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { content, image, type } = req.body;

    const newPost = await Post.create({
      author: user._id,
      content,
      image,
      type: type || 'moment',
      likes: [],
      comments: []
    });

    const populatedPost = await Post.findById(newPost._id).populate('author', 'name avatar handle');

    // Real-time broadcast
    const io = req.app.get('io');
    io.emit('post:new', populatedPost);

    res.status(201).json(populatedPost);
  } catch (error) {
    Logger.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/posts/:id/like - Toggle like
router.put('/:id/like', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    const likeIndex = post.likes.indexOf(user._id as any);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(user._id as any);
    }

    await post.save();
    
    // Real-time broadcast
    const io = req.app.get('io');
    io.emit('post:update', { postId: post._id, likes: post.likes });

    res.json(post.likes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/comment - Add comment
router.post('/:id/comment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { text } = req.body;
    
    if (!text) return res.status(400).json({ message: 'Text required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = {
      user: user._id,
      text,
      createdAt: new Date()
    };

    // @ts-ignore
    post.comments.push(newComment);
    await post.save();

    // Re-fetch to populate user details for the new comment
    const updatedPost = await Post.findById(post._id).populate('comments.user', 'name avatar');
    
    const io = req.app.get('io');
    io.emit('post:comment', { postId: post._id, comments: updatedPost?.comments });

    res.json(updatedPost?.comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;