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

const validUser = {
  username: 'user1',
  email: 'angel@angel.com',
  password: 'password',
};
const postUser = (user = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
};

describe('user registration ', () => {
  it('returns 201 ok when registering using valid data', async () => {
    const response = await postUser();
    expect(response.status).toBe(201);
  });

  it('return success message then signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('user created');
  });

  it('saves the user to database', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('saves the user and email to database', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList[0].username).toBe('user1');
    expect(userList[0].email).toBe('angel@angel.com');
  });

  it('hashing password in to database', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList[0].password).not.toBe('password1');
  });

  it('hashing password in to database', async () => {
    const response = await postUser({
      username: null,
      email: 'angel@angel.com',
      password: 'password',
    });
    expect(response.status).toBe(400);
  });

  it('return validation error file in response body when validation errors', async () => {
    const response = await postUser({
      username: null,
      email: 'angel@angel.com',
      password: 'password',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it('email and username can not be null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'password',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  // it.each([
  //   ['username', 'Username cannot be null'],
  //   ['email', 'Email cannot be null'],
  //   ['password', 'Password cannot be null'],
  // ])('when %s is null %s is received', async (field, expectedMessage) => {
  //   const user = {
  //     username: 'user1',
  //     email: 'uaser@gmail.com',
  //     password: '1234545',
  //   };
  //   user[field] = null;
  //   const response = await postUser(user);
  //   const body = response.body;
  //   expect(body.validationErrors[field]).toBe(expectedMessage);
  // });

  it.each`
    field         | expectedMessage
    ${'username'} | ${'Username cannot be null'}
    ${'email'}    | ${'Email cannot be null'}
    ${'password'} | ${'Password cannot be null'}
  `(
    'returns $expectedMessage when $field is null',
    async ({ field, expectedMessage }) => {
      const user = {
        username: 'user1',
        email: 'angel@angel.com',
        password: '1234545',
      };
      user[field] = null;
      const response = await postUser(user);
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    },
  );
});
