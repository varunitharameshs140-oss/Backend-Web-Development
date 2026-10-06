'use strict';

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,

  // In a multi-instance deployment, rate-limit-redis can replace the
  // default in-memory store with a shared Redis store. The in-memory
  // store keeps separate counters for each server instance, so requests
  // distributed by a load balancer could bypass the intended limit.
});

module.exports = authLimiter;