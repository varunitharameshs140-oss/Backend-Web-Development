const express = require('express');
const { posts } = require('../data');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// List posts — any authenticated user.
router.get('/', (req, res) => {
  return res.status(200).json(posts);
});

// Create a post — the caller becomes the author.
router.post('/', (req, res) => {
  const post = {
    id: String(posts.length + 1),
    authorId: req.user.id,
    title: req.body?.title ?? 'Untitled',
    hidden: false,
  };

  posts.push(post);
  return res.status(201).json(post);
});

// Update a post — only the owner or moderator/admin.
router.patch('/:id', (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);

  // Post doesn't exist
  if (!post) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Post not found',
      },
    });
  }

  const isOwner = post.authorId === req.user.id;
  const isPrivileged =
    req.user.role === 'moderator' || req.user.role === 'admin';

  // Not owner and not moderator/admin
  if (!isOwner && !isPrivileged) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You can only modify your own posts',
      },
    });
  }

  post.title = req.body?.title ?? post.title;

  return res.status(200).json(post);
});

// Delete a post — only the owner or moderator/admin.
router.delete('/:id', (req, res) => {
  const idx = posts.findIndex((p) => p.id === req.params.id);

  // Post doesn't exist
  if (idx === -1) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Post not found',
      },
    });
  }

  const post = posts[idx];

  const isOwner = post.authorId === req.user.id;
  const isPrivileged =
    req.user.role === 'moderator' || req.user.role === 'admin';

  // Not owner and not moderator/admin
  if (!isOwner && !isPrivileged) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You can only modify your own posts',
      },
    });
  }

  posts.splice(idx, 1);

  return res.status(200).json({ ok: true });
});

// Hide a post — moderator/admin only.
router.post(
  '/:id/hide',
  requireRole('moderator', 'admin'),
  (req, res) => {
    const post = posts.find((p) => p.id === req.params.id);

    if (!post) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found',
        },
      });
    }

    post.hidden = true;

    return res.status(200).json(post);
  }
);

module.exports = router;
