const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const nodemailerStub = require('nodemailer-stub');
const EmailService = require('../src/email/EmailService');
const { validator } = require('sequelize/lib/utils/validator-extras');

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
const postUser = (user = validUser, options = {}) => {
  const agent = request(app).post('/api/1.0/users');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return agent.send(user);
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
  const email_inuse = 'Email in use';

  it(`returns ${email_inuse} when same email is already in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    const body = response.body;
    expect(body.validationErrors.email).toBe(`${email_inuse}`);
  });

  it('returns arrors for botch username is null and already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'passworD1',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  const username_null = 'Username cannot be null';
  const username_size = 'Must have min 4 and max 32 characters';
  const email_null = 'Email cannot be null';
  const email_invalid = 'Email is not valid';
  const password_null = 'Password cannot be null';
  const password_size = 'Password must be at least 6 characters';
  const password_pattern =
    'Password must be at least 1 uppercase, 1 lowercase letter and 1 number';

  it.each`
    field         | value                 | expectedMessage
    ${'username'} | ${null}               | ${username_null}
    ${'username'} | ${'use'}              | ${username_size}
    ${'username'} | ${'u'.length}         | ${username_size}
    ${'email'}    | ${null}               | ${email_null}
    ${'email'}    | ${'mail.com'}         | ${email_invalid}
    ${'email'}    | ${'user.mail.com'}    | ${email_invalid}
    ${'email'}    | ${'user@amil'}        | ${email_invalid}
    ${'password'} | ${null}               | ${password_null}
    ${'password'} | ${'P4ssd'}            | ${password_size}
    ${'password'} | ${'alllowercase'}     | ${password_pattern}
    ${'password'} | ${'ALLUPERCASE'}      | ${password_pattern}
    ${'password'} | ${'123456789'}        | ${password_pattern}
    ${'password'} | ${'lowerandUPERCASE'} | ${password_pattern}
    ${'password'} | ${'lowerand3333'}     | ${password_pattern}
    ${'password'} | ${'UPPER3333'}        | ${password_pattern}
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
  it('create user in inactive mode', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList[0].inactive).toBe(true);
  });

  it('create user in inactive mode even the request body contains inactive mode', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });

  it('create user in active mode', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList[0].inactive).toBe(true);
  });

  it('send email to account activation email with activationToken', async () => {
    await postUser();
    const lastMail = nodemailerStub.interactsWithMail.lastMail();
    expect(lastMail.to[0]).toBe(validUser.email);
    const users = await User.findAll();
    expect(lastMail.content).toContain(users[0].activationToken);
  });
  it('return 502 bad gateway when sending email fials', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendActivationEmail')
      .mockRejectedValueOnce({ message: 'Failed to deliver email' });
    const response = await postUser();
    expect(response.status).toBe(502);
    mockSendAccountActivation.mockRestore();
  });
  it('return Email failure message when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendActivationEmail')
      .mockRejectedValueOnce({ message: 'Failed to deliver email' });
    const response = await postUser();
    expect(response.body.message).toBe('Email Failure');
    mockSendAccountActivation.mockRestore();
  });
  it('does not save user to database if activation email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendActivationEmail')
      .mockRejectedValueOnce({ message: 'Failed to deliver email' });
    await postUser();
    mockSendAccountActivation.mockRestore();
    const users = await User.findAll();
    expect(users.length).toBe(0);
  });
});

describe('internationalization', () => {
  const username_null = "Le nom d'utilisateur ne peut pas être nul";
  const username_size = 'Doit avoir au moins 4 et au plus 32 caractères';
  const email_null = "L'adresse e-mail ne peut pas être nulle";
  const email_invalid = "L'adresse e-mail n'est pas valide";
  const password_null = 'Le mot de passe ne peut pas être nul';
  const password_size = 'Le mot de passe doit comporter au moins 6 caractères';
  const password_pattern =
    'Le mot de passe doit comporter au moins 1 lettre majuscule, 1 lettre minuscule et 1 chiffre';
  const email_inuse = 'Adresse e-mail déjà utilisée';
  const user_create_success = 'Utilisateur créé';
  const email_failure = "Échec de l'e-mail";

  it.each`
    field         | value                 | expectedMessage
    ${'username'} | ${null}               | ${username_null}
    ${'username'} | ${'use'}              | ${username_size}
    ${'username'} | ${'u'.length}         | ${username_size}
    ${'email'}    | ${null}               | ${email_null}
    ${'email'}    | ${'mail.com'}         | ${email_invalid}
    ${'email'}    | ${'user.mail.com'}    | ${email_invalid}
    ${'email'}    | ${'user@amil'}        | ${email_invalid}
    ${'password'} | ${null}               | ${password_null}
    ${'password'} | ${'P4ssd'}            | ${password_size}
    ${'password'} | ${'alllowercase'}     | ${password_pattern}
    ${'password'} | ${'ALLUPERCASE'}      | ${password_pattern}
    ${'password'} | ${'123456789'}        | ${password_pattern}
    ${'password'} | ${'lowerandUPERCASE'} | ${password_pattern}
    ${'password'} | ${'lowerand3333'}     | ${password_pattern}
    ${'password'} | ${'UPPER3333'}        | ${password_pattern}
  `(
    'returns $expectedMessage when $field is $value',
    async ({ field, expectedMessage, value }) => {
      const user = {
        username: 'user1',
        email: 'angel@angel.com',
        password: 'OPd1234545',
      };
      user[field] = value;
      const response = await postUser(user, { language: 'fr' });
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    },
  );

  it(`returns email_inuse when same email is already in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser({ ...validUser }, { language: 'fr' });
    const body = response.body;
    expect(body.validationErrors.email).toBe(email_inuse);
  });

  it('return success message then signup request is valid', async () => {
    const response = await postUser({ ...validUser }, { language: 'fr' });
    expect(response.body.message).toBe(user_create_success);
  });
  it('return Email failure message when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendActivationEmail')
      .mockRejectedValueOnce({ message: email_failure });
    const response = await postUser({ ...validUser }, { language: 'fr' });
    expect(response.body.message).toBe(email_failure);
    mockSendAccountActivation.mockRestore();
  });
});
