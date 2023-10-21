const request = require('supertest');
const app = require('../src/app');

describe('user registration ', () => {
  it('returns 200 ok when registering using valid data', (done) => {
    request(app)
      .post('/api/v1/users')
      .send({
        username: 'user1',
        email: 'angel@angel.com',
        password: 'password',
      })
      .then((response) => {
        expect(response.status).toBe(200);
        done();
      });
    // .expect(200, done);
  });
});

it('return success message then signup request is valid', (done) => {
  request(app)
    .post('/api/v1/users')
    .send({
      username: 'user1',
      email: 'angel@angel.com',
      password: 'password1',
    })
    .then((response) => {
      expect(response.body.message).toBe('user created');
      done();
    });
});
