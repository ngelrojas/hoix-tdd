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
  password: 'passworD1',
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
      password: 'password1D',
    });
    expect(response.status).toBe(400);
  });

  it('return validation error file in response body when validation errors', async () => {
    const response = await postUser({
      username: null,
      email: 'angel@angel.com',
      password: 'password1D',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it('email and username can not be null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'passwor1D',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it.each`
    field         | value                 | expectedMessage
    ${'username'} | ${null}               | ${'Username cannot be null'}
    ${'username'} | ${'use'}              | ${'Must have min 4 and max 32 characters'}
    ${'username'} | ${'u'.length}         | ${'Must have min 4 and max 32 characters'}
    ${'email'}    | ${null}               | ${'Email cannot be null'}
    ${'email'}    | ${'mail.com'}         | ${'Email is not valid'}
    ${'email'}    | ${'user.mail.com'}    | ${'Email is not valid'}
    ${'email'}    | ${'user@amil'}        | ${'Email is not valid'}
    ${'password'} | ${null}               | ${'Password cannot be null'}
    ${'password'} | ${'P4ssd'}            | ${'Password must be at least 6 characters'}
    ${'password'} | ${'alllowercase'}     | ${'Password must be at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'ALLUPERCASE'}      | ${'Password must be at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'123456789'}        | ${'Password must be at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerandUPERCASE'} | ${'Password must be at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerand3333'}     | ${'Password must be at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPER3333'}        | ${'Password must be at least 1 uppercase, 1 lowercase letter and 1 number'}
  `(
    'returns $expectedMessage when $field is $value',
    async ({ field, expectedMessage, value }) => {
      const user = {
        username: 'user1',
        email: 'angel@angel.com',
        password: 'OPd1234545',
      };
      user[field] = value;
      const response = await postUser(user);
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    },
  );
});
