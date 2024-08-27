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

describe('GET /api/articles/:article_id', () => {
  it('200: responds with the specified article', () => {
    return request(app)
      .get('/api/articles/8')
      .expect(200)
      .then(({ body: { article } }) => {
        expect(article).toEqual({
          article_id: 8,
          title: 'Does Mitch predate civilisation?',
          topic: 'mitch',
          author: 'icellusedkars',
          body: 'Archaeologists have uncovered a gigantic statue from the dawn of humanity, and it has an uncanny resemblance to Mitch. Surely I am not the only person who can see this?!',
          created_at: '2020-04-17T01:08:00.000Z',
          votes: 0,
          article_img_url:
            'https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700',
        });
      });
  });
  it('400: responds with bad request for an invalid article_id', () => {
    return request(app)
      .get('/api/articles/not-an-id')
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
});
