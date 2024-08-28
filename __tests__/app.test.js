const request = require('supertest');
const app = require('../app');
const db = require('../db/connection');
const seed = require('../db/seeds/seed');
const testData = require('../db/data/test-data');
const endpointsData = require('../endpoints.json');

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
        expect(endpoints).toEqual(endpointsData);
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
  it('404: responds with not found for a valid but non-existent id', () => {
    return request(app)
      .get('/api/articles/999')
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
  });
});

describe('GET /api/articles', () => {
  it('200: responds with an array of article objects, sorted by date in descending order', () => {
    return request(app)
      .get('/api/articles')
      .expect(200)
      .then(({ body: { articles } }) => {
        expect(articles.length).toBe(13);
        expect(articles).toBeSortedBy('created_at', { descending: true });
        articles.forEach((article) => {
          expect(typeof article.author).toBe('string');
          expect(typeof article.title).toBe('string');
          expect(typeof article.article_id).toBe('number');
          expect(typeof article.topic).toBe('string');
          expect(typeof article.created_at).toBe('string');
          expect(typeof article.votes).toBe('number');
          expect(typeof article.article_img_url).toBe('string');
          expect(article).not.toHaveProperty('body');
        });
      });
  });
  it('↳ comment_count for each article should be the total count of all comments with this article_id', () => {
    return request(app)
      .get('/api/articles')
      .expect(200)
      .then(({ body: { articles } }) => {
        articles.forEach((article) => {
          expect(typeof article.comment_count).toBe('number');
        });
        const commentCounts = articles.map(({ comment_count, article_id }) => [
          comment_count,
          article_id,
        ]);
        expect(commentCounts).toEqual([
          [2, 3],
          [1, 6],
          [0, 2],
          [0, 12],
          [0, 13],
          [2, 5],
          [11, 1],
          [2, 9],
          [0, 10],
          [0, 4],
          [0, 8],
          [0, 11],
          [0, 7],
        ]);
      });
  });
});

describe('GET /api/articles/:article_id/comments', () => {
  it('200: responds with all comments for an article, sorted by date in descending order', () => {
    return request(app)
      .get('/api/articles/3/comments')
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments.length).toBe(2);
        expect(comments).toBeSortedBy('created_at', { descending: true });
        comments.forEach((comment) => {
          expect(typeof comment.comment_id).toBe('number');
          expect(typeof comment.votes).toBe('number');
          expect(typeof comment.created_at).toBe('string');
          expect(typeof comment.author).toBe('string');
          expect(typeof comment.body).toBe('string');
          expect(typeof comment.article_id).toBe('number');
        });
      });
  });
  it('400: responds with bad request for an invalid article_id', () => {
    return request(app)
      .get('/api/articles/not-an-id/comments')
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
  it('404: responds with not found for an article with no comments', () => {
    return request(app)
      .get('/api/articles/7/comments')
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
  });
  it('↳ or if the article does not exist', () => {
    return request(app)
      .get('/api/articles/999/comments')
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
  });
});

describe('POST /api/articles/:article_id/comments', () => {
  it('201: adds a comment for an article and responds with the added comment', () => {
    const testComment = { username: 'lurker', body: 'wow... cool article' };
    return request(app)
      .post('/api/articles/3/comments')
      .send(testComment)
      .expect(201)
      .then(({ body: { comment } }) => {
        expect(comment.comment_id).toBe(19);
        expect(comment.body).toBe('wow... cool article');
        expect(comment.article_id).toBe(3);
        expect(comment.author).toBe('lurker');
        expect(comment.votes).toBe(0);
        expect(typeof comment.created_at).toBe('string');
      });
  });
  it('400: responds with bad request if missing username or body', () => {
    const emptyComment = {};
    const noUsername = { body: 'who wrote this?!' };
    const noBody = { username: 'nobody' };

    const testPromises = [
      request(app)
        .post('/api/articles/3/comments')
        .expect(400)
        .send(emptyComment)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Bad request');
        }),
      request(app)
        .post('/api/articles/3/comments')
        .expect(400)
        .send(noBody)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Bad request');
        }),
      request(app)
        .post('/api/articles/3/comments')
        .expect(400)
        .send(noUsername)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Bad request');
        }),
    ];

    return Promise.all(testPromises);
  });
  it('↳ if username does not match a username in the users table', () => {
    const testComment = { username: 'joshuatdr', body: 'did you know gaming' };
    return request(app)
      .post('/api/articles/3/comments')
      .send(testComment)
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
  it('↳ if article_id is invalid', () => {
    const testComment = { username: 'lurker', body: 'what does this do' };
    return request(app)
      .post('/api/articles/not-an-id/comments')
      .send(testComment)
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
  it('↳ or if article_id is valid but non-existent', () => {
    const testComment = { username: 'lurker', body: 'ahead of the curve' };
    return request(app)
      .post('/api/articles/999/comments')
      .send(testComment)
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
});
