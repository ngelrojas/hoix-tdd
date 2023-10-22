const express = require('express');
const UserService = require('./UserService');
const router = express.Router();

router.post('/api/1.0/users', async (req, res) => {
  const user = req.body;
  if (user.username === null) {
    return res.status(400).send({
      validationErrors: {
        username: 'Username cannot be null, ok',
      },
    });
  }
  await UserService.save(req.body);
  return res.status(201).send({ message: 'user created' });
});

module.exports = router;
