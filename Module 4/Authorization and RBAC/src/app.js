require('dotenv').config();

const express = require('express');
const requireAuth = require('./middleware/requireAuth');
const requireRole = require('./middleware/requireRole');
const { signToken } = require('./utils/jwt');
const { users } = require('./data');
const postsRouter = require('./routes/posts');

const app = express();

app.use(express.json());

// Public route: generate a test token.
app.post('/auth/login', (req, res) => {
  const sub = req.body.sub || 'u-A';
  const role = req.body.role || 'member';

  return res.status(200).json({
    token: signToken(sub, role),
  });
});

// All routes below require a valid authentication token.
app.use(requireAuth);

// Post routes.
app.use('/posts', postsRouter);

// Delete a user: admin only.
app.delete('/users/:id', requireRole('admin'), (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  users.splice(idx, 1);

  return res.status(200).json({ ok: true });
});

// Central error handler.
app.use((error, req, res, next) => {
  console.error(error.message);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
});

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`RBAC starter listening on ${port}`);
});

module.exports = app;