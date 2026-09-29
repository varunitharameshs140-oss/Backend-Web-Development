'use strict';
// routes/payments.js

const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');

router.post('/', (req, res) => {
  const key = req.headers['idempotency-key'];

  // 1. Missing Idempotency-Key
  if (!key) {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required'
      }
    });
  }

  // 2. Repeat key
  if (idempotency.has(key)) {
    const stored = idempotency.get(key);

    return res.status(stored.status).json(stored.body);
  }

  // 3. New key - create exactly one charge
  const amount = req.body && req.body.amount;

  const charge = {
    id: nextChargeId(),
    amount,
    status: 'charged'
  };

  charges.push(charge);

  const body = {
    id: charge.id,
    amount: charge.amount,
    status: charge.status
  };

  // Store the response for future retries
  idempotency.set(key, {
    status: 201,
    body
  });

  return res.status(201).json(body);
});

module.exports = router;