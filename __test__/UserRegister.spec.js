const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

describe('user registration ', () => {
  const postValidUser = () => {
    return request(app).post('/api/1.0/users').send({
      username: 'user1',
      email: 'angel@angel.com',
      password: 'password',
    });
  };

  it('returns 201 ok when registering using valid data', async () => {
    const response = await postValidUser();
    expect(response.status).toBe(201);
  });

  it('return success message then signup request is valid', async () => {
    const response = await postValidUser();
    expect(response.body.message).toBe('user created');
  });

  it('saves the user to database', async () => {
    await postValidUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('saves the user and email to database', async () => {
    await postValidUser();
    const userList = await User.findAll();
    expect(userList[0].username).toBe('user1');
    expect(userList[0].email).toBe('angel@angel.com');
  });

  it('hashing password in to database', async () => {
    await postValidUser();
    const userList = await User.findAll();
    expect(userList[0].password).not.toBe('password1');
  });
});
