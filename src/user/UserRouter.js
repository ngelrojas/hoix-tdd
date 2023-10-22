const express = require('express');
const UserService = require('./UserService');
const router = express.Router();

router.post('/api/1.0/users', async (req, res) => {
  await UserService.save(req.body);
  return res.status(201).send({ message: 'user created' });
});

module.exports = router;