const request = require('supertest');
const app = require('../app');
const db = require('../db/connection');
const seed = require('../db/seeds/seed');
const testData = require('../db/data/test-data');

beforeEach(() => seed(testData));
afterAll(() => db.end());

describe('GET /not-a-route', () => {
  it('404: responds with not found', () => {
    return request(app).get('/not-a-route').expect(404);
  });
});

describe('GET /api', () => {
  it('200: responds with an object detailing all of the available endpoints', () => {
    return request(app)
      .get('/api')
      .expect(200)
      .then(({ body: { endpoints } }) => {
        expect(endpoints).toHaveProperty('GET /api', expect.any(Object));
        expect(endpoints).toHaveProperty('GET /api/topics', expect.any(Object));
        expect(endpoints).toHaveProperty(
          'GET /api/articles',
          expect.any(Object)
        );
      });
  });
});

describe('GET /api/topics', () => {
  it('200: responds with an array of topic objects', () => {
    return request(app)
      .get('/api/topics')
      .expect(200)
      .then(({ body: { topics } }) => {
        expect(topics.length).toBe(3);
        topics.forEach((topic) => {
          expect(typeof topic.description).toBe('string');
          expect(typeof topic.slug).toBe('string');
        });
      });
  });
});
