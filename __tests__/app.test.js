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
          expect(topic).toMatchObject({
            description: expect.any(String),
            slug: expect.any(String),
          });
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
        expect(article).toMatchObject({
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
  it('200: article has correct comment_count', () => {
    return request(app)
      .get('/api/articles/1')
      .expect(200)
      .then(({ body: { article } }) => {
        expect(article.comment_count).toBe(11);
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
        expect(articles.length).toBe(10);
        expect(articles).toBeSortedBy('created_at', { descending: true });
        articles.forEach((article) => {
          expect(article).toMatchObject({
            author: expect.any(String),
            title: expect.any(String),
            article_id: expect.any(Number),
            topic: expect.any(String),
            created_at: expect.any(String),
            votes: expect.any(Number),
            article_img_url: expect.any(String),
          });
          expect(article).not.toHaveProperty('body');
        });
      });
  });
  it('200: comment_count for each article should be the total count of all comments with this article_id', () => {
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
        ]);
      });
  });
  describe('queries:', () => {
    it('200: sort_by sorts articles by any valid column', () => {
      const validColumns = [
        'author',
        'title',
        'article_id',
        'topic',
        'created_at',
        'votes',
        'comment_count',
      ];
      const sortByTests = validColumns.map((query) => {
        return request(app)
          .get(`/api/articles?sort_by=${query}`)
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toBeSortedBy(query, { descending: true });
          });
      });
      return Promise.all(sortByTests);
    });
    it('200: order can be set to ascending or descending', () => {
      const ascTest = request(app)
        .get('/api/articles?order=asc')
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy('created_at', { descending: false });
        });
      const descTest = request(app)
        .get('/api/articles?order=desc')
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy('created_at', { descending: true });
        });
      return Promise.all([ascTest, descTest]);
    });
    it('200: sort_by and order can both be passed in a single query', () => {
      return request(app)
        .get('/api/articles?sort_by=comment_count&order=asc')
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy('comment_count', { descending: false });
        });
    });
    it('200: ignores unexpected query parameters', () => {
      return request(app)
        .get('/api/articles?sort_by=votes&order=desc&cool=extremely')
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy('votes', { descending: true });
        });
    });
    it('400: responds with bad request if sort_by is not a whitelisted column', () => {
      return request(app)
        .get('/api/articles?sort_by=article_img_url')
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Bad request');
        });
    });
    it('400: responds with bad request if order is invalid', () => {
      return request(app)
        .get('/api/articles?order=asc;SELECT*FROM users;')
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Bad request');
        });
    });
    it('200: topic filters articles to match the specified topic', () => {
      return request(app)
        .get('/api/articles?topic=mitch')
        .expect(200)
        .then(({ body: { articles } }) => {
          articles.forEach((article) => {
            expect(article).toMatchObject({
              author: expect.any(String),
              title: expect.any(String),
              article_id: expect.any(Number),
              topic: 'mitch',
              created_at: expect.any(String),
              votes: expect.any(Number),
              article_img_url: expect.any(String),
              comment_count: expect.any(Number),
            });
          });
        });
    });
    it('404: responds with not found if topic does not exist', () => {
      return request(app)
        .get('/api/articles?topic=gaming;DROP TABLE users;')
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Not found');
        });
    });
    it('404: responds with not found if topic exists but no articles have this topic', () => {
      return request(app)
        .get('/api/articles?topic=paper')
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Not found');
        });
    });
    it('200: limit can specify a number of articles to return (default 10)', () => {
      const defaultLimitTest = request(app)
        .get('/api/articles')
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles.length).toBe(10);
        });
      const specifiedLimitTest = request(app)
        .get('/api/articles?limit=5')
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles.length).toBe(5);
        });
      return Promise.all([defaultLimitTest, specifiedLimitTest]);
    });
    it('400: responds with bad request for invalid limit parameter', () => {
      return request(app)
        .get('/api/articles?limit=onehundred')
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Bad request');
        });
    });
    it('400: responds with bad request for limit outside of acceptable range', () => {
      return request(app)
        .get('/api/articles?limit=10500')
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Bad request');
        });
    });
    it("200: 'p' can specify the page to begin returning articles (default 1)", () => {
      const firstPageTest = request(app)
        .get('/api/articles')
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles.length).toBe(10);
        });
      const secondPageTest = request(app)
        .get('/api/articles?p=2')
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles.length).toBe(3);
        });
      return Promise.all([firstPageTest, secondPageTest]);
    });
    it("400: responds with bad request for invalid 'p' parameter", () => {
      return request(app)
        .get('/api/articles?p=test')
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Bad request');
        });
    });
    it('400: responds with bad request for page outside of acceptable range', () => {
      return request(app)
        .get('/api/articles?p=50000')
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Bad request');
        });
    });
    it('200: responds with the total_count, displaying the total number of articles after any filters are applied', () => {
      return request(app)
        .get('/api/articles?topic=mitch')
        .expect(200)
        .then(({ body: { articles, total_count } }) => {
          expect(articles.length).toBe(10);
          expect(total_count).toBe(12);
        });
    });
  });
});

describe('POST /api/articles', () => {
  it('201: responds with the newly created article', () => {
    const testArticle = {
      author: 'lurker',
      title: 'Test article',
      body: 'Words and such...',
      topic: 'cats',
      article_img_url:
        'https://archives.bulbagarden.net/media/upload/f/fb/0703Carbink.png',
    };
    return request(app)
      .post('/api/articles')
      .send(testArticle)
      .expect(201)
      .then(({ body: { article } }) => {
        expect(article).toMatchObject({
          article_id: expect.any(Number),
          author: 'lurker',
          title: 'Test article',
          body: 'Words and such...',
          topic: 'cats',
          article_img_url:
            'https://archives.bulbagarden.net/media/upload/f/fb/0703Carbink.png',
          votes: 0,
          created_at: expect.any(String),
          comment_count: 0,
        });
      });
  });
  it('201: default article_img_url is added if not specified', () => {
    const testArticle = {
      author: 'lurker',
      topic: 'cats',
      title: 'Whoops, forgot the img',
      body: 'But it was added by default!',
    };
    return request(app)
      .post('/api/articles')
      .send(testArticle)
      .expect(201)
      .then(({ body: { article } }) => {
        expect(article).toMatchObject({
          article_id: expect.any(Number),
          author: 'lurker',
          title: 'Whoops, forgot the img',
          body: 'But it was added by default!',
          topic: 'cats',
          article_img_url:
            'https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700',
          votes: 0,
          created_at: expect.any(String),
          comment_count: 0,
        });
      });
  });
  it('201: ignores any unnecessary properties included on the request', () => {
    const testArticle = {
      author: 'lurker',
      topic: 'paper',
      title: 'title',
      body: 'body',
      shopping_list: ['tea', 'pizza', 'crumpets'],
    };
    return request(app)
      .post('/api/articles')
      .send(testArticle)
      .expect(201)
      .then(({ body: { article } }) => {
        expect(article).toMatchObject({
          article_id: expect.any(Number),
          author: 'lurker',
          title: 'title',
          body: 'body',
          topic: 'paper',
          article_img_url:
            'https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700',
          votes: 0,
          created_at: expect.any(String),
          comment_count: 0,
        });
      });
  });
  it('400: responds with bad request if any of author, topic, title, body are missing', () => {
    const requiredColumns = ['author', 'topic', 'title', 'body'];
    const testPromises = requiredColumns.map((column) => {
      const testArticle = {
        author: 'lurker',
        topic: 'cats',
        title: 'test',
        body: 'TEST',
      };
      delete testArticle[column];
      return request(app)
        .post('/api/articles')
        .send(testArticle)
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Bad request');
        });
    });
    return Promise.all(testPromises);
  });
  it('404: responds with not found if author is not a registered user or topic does not exist', () => {
    const userNotFound = request(app)
      .post('/api/articles')
      .send({
        author: 'markiplier',
        topic: 'cats',
        title: 'test',
        body: 'TEST',
      })
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
    const topicNotFound = request(app)
      .post('/api/articles')
      .send({
        author: 'lurker',
        topic: 'gaming',
        title: 'test',
        body: 'TEST',
      })
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
    return Promise.all([userNotFound, topicNotFound]);
  });
  it('does not post article if 400 or 404 response', () => {
    const testArticle = {
      author: 'joshuatdr',
      topic: 'cats',
      title: 'title',
      body: 'body',
    };
    return request(app)
      .post('/api/articles')
      .send(testArticle)
      .expect(404)
      .then(() => {
        return request(app).get('/api/articles?limit=15').expect(200);
      })
      .then(({ body: { articles } }) => {
        expect(articles.length).toBe(13);
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
          expect(comment).toMatchObject({
            comment_id: expect.any(Number),
            body: expect.any(String),
            article_id: expect.any(Number),
            author: expect.any(String),
            votes: expect.any(Number),
            created_at: expect.any(String),
          });
        });
      });
  });
  it('200: responds with empty array for an article with no comments', () => {
    return request(app)
      .get('/api/articles/7/comments')
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments).toEqual([]);
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
  it('404: responds with not found for a valid but non-existent article_id', () => {
    return request(app)
      .get('/api/articles/999/comments')
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
  });
  it('200: limit can specify a number of comments to return (default 10)', () => {
    const defaultLimitTest = request(app)
      .get('/api/articles/1/comments')
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments.length).toBe(10);
      });
    const specifiedLimitTest = request(app)
      .get('/api/articles/1/comments?limit=5')
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments.length).toBe(5);
      });
    return Promise.all([defaultLimitTest, specifiedLimitTest]);
  });
  it('400: responds with bad request for invalid limit parameter', () => {
    return request(app)
      .get('/api/articles/1/comments?limit=onehundred')
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
  it('400: responds with bad request for limit outside of acceptable range', () => {
    return request(app)
      .get('/api/articles/1/comments?limit=10500')
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
  it("200: 'p' can specify the page to begin returning comments (default 1)", () => {
    const firstPageTest = request(app)
      .get('/api/articles/1/comments')
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments.length).toBe(10);
      });
    const secondPageTest = request(app)
      .get('/api/articles/1/comments?p=2')
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments.length).toBe(1);
      });
    return Promise.all([firstPageTest, secondPageTest]);
  });
  it("400: responds with bad request for invalid 'p' parameter", () => {
    return request(app)
      .get('/api/articles/1/comments?p=test')
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
  it('400: responds with bad request for page outside of acceptable range', () => {
    return request(app)
      .get('/api/articles/1/comments?p=-1')
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
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
        expect(comment).toMatchObject({
          comment_id: expect.any(Number),
          body: 'wow... cool article',
          article_id: 3,
          author: 'lurker',
          votes: 0,
          created_at: expect.any(String),
        });
      });
  });
  it('201: comment will post given valid username and body even if unnecessary properties are present', () => {
    const testComment = {
      username: 'lurker',
      body: 'wow... cool article',
      dummy: 'what am i doing here',
      another_dummy: 999,
    };
    return request(app)
      .post('/api/articles/4/comments')
      .send(testComment)
      .expect(201)
      .then(({ body: { comment } }) => {
        expect(comment).toMatchObject({
          comment_id: expect.any(Number),
          body: 'wow... cool article',
          article_id: 4,
          author: 'lurker',
          votes: 0,
          created_at: expect.any(String),
        });
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
  it('400: if article_id is invalid', () => {
    const testComment = { username: 'lurker', body: 'what does this do' };
    return request(app)
      .post('/api/articles/not-an-id/comments')
      .send(testComment)
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
  it('404: responds with not found if article_id is valid but non-existent', () => {
    const testComment = { username: 'lurker', body: 'ahead of the curve' };
    return request(app)
      .post('/api/articles/999/comments')
      .send(testComment)
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
  });
  it('404: if username does not match a username in the users table', () => {
    const testComment = { username: 'joshuatdr', body: 'did you know gaming' };
    return request(app)
      .post('/api/articles/3/comments')
      .send(testComment)
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
  });
});

describe('PATCH /api/articles/:article_id', () => {
  it('200: updates and responds with an article by article_id', () => {
    const incVotes = { inc_votes: -200 };
    return request(app)
      .patch('/api/articles/1')
      .send(incVotes)
      .expect(200)
      .then(({ body: { article } }) => {
        expect(article).toMatchObject({
          article_id: 1,
          title: expect.any(String),
          topic: expect.any(String),
          author: expect.any(String),
          body: expect.any(String),
          created_at: expect.any(String),
          votes: -100,
          article_img_url: expect.any(String),
        });
      });
  });
  it('200: updates article given valid inc_votes even if unnecessary properties are present', () => {
    const incVotes = { inc_votes: 50, dummy: 'i do nothing' };
    return request(app)
      .patch('/api/articles/2')
      .send(incVotes)
      .expect(200)
      .then(({ body: { article } }) => {
        expect(article).toMatchObject({
          article_id: 2,
          title: expect.any(String),
          topic: expect.any(String),
          author: expect.any(String),
          body: expect.any(String),
          created_at: expect.any(String),
          votes: 50,
          article_img_url: expect.any(String),
        });
      });
  });
  it('400: responds with bad request if inc_votes is invalid or missing', () => {
    const invalidIncVotes = request(app)
      .patch('/api/articles/1')
      .send({ inc_votes: 'five votes' })
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
    const missingIncVotes = request(app)
      .patch('/api/articles/1')
      .send({ dummy: 999 })
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
    return Promise.all([invalidIncVotes, missingIncVotes]);
  });
  it('400: if article_id is not valid', () => {
    const incVotes = { inc_votes: 1 };
    return request(app)
      .patch('/api/articles/not-an-id')
      .send(incVotes)
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
  it('404: responds with not found if article_id is valid but non-existent', () => {
    const incVotes = { inc_votes: -1 };
    return request(app)
      .patch('/api/articles/999')
      .send(incVotes)
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
  });
});

describe('DELETE /api/comments/:comment_id', () => {
  it('204: deletes a specified comment and responds with no content', () => {
    return request(app)
      .delete('/api/comments/10')
      .expect(204)
      .then(() => {
        return request(app).get('/api/articles/3/comments').expect(200);
      })
      .then(({ body: { comments } }) => {
        expect(comments.length).toBe(1);
        expect(comments[0].comment_id).not.toBe(10);
      });
  });
  it('400: responds with bad request if comment_id is invalid', () => {
    return request(app)
      .delete('/api/comments/not-an-id')
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
  it('404: responds with not found if comment_id is valid but non-existent', () => {
    return request(app)
      .delete('/api/comments/999')
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
  });
});

describe('PATCH /api/comments/:comment_id', () => {
  it('200: updates votes and responds with a specified comment', () => {
    const increment = request(app)
      .patch('/api/comments/8')
      .send({ inc_votes: 5 })
      .then(({ body: { comment } }) => {
        expect(comment).toMatchObject({
          comment_id: 8,
          body: 'Delicious crackerbreads',
          article_id: 1,
          author: 'icellusedkars',
          votes: 5,
          created_at: '2020-04-14T20:19:00.000Z',
        });
      });
    const decrement = request(app)
      .patch('/api/comments/9')
      .send({ inc_votes: -10 })
      .then(({ body: { comment } }) => {
        expect(comment).toMatchObject({
          comment_id: 9,
          body: 'Superficially charming',
          article_id: 1,
          author: 'icellusedkars',
          votes: -10,
          created_at: '2020-01-01T03:08:00.000Z',
        });
      });
    return Promise.all([increment, decrement]);
  });
  it('400: responds with bad request if comment_id is invalid', () => {
    return request(app)
      .patch('/api/comments/not-an-id')
      .send({ inc_votes: 999 })
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Bad request');
      });
  });
  it('404: responds with not found if comment_id is valid but non-existent', () => {
    return request(app)
      .patch('/api/comments/999')
      .send({ inc_votes: -1 })
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
  });
});

describe('GET /api/users', () => {
  it('200: responds with an array of user objects', () => {
    return request(app)
      .get('/api/users')
      .expect(200)
      .then(({ body: { users } }) => {
        users.forEach((user) => {
          expect(user).toMatchObject({
            username: expect.any(String),
            name: expect.any(String),
            avatar_url: expect.any(String),
          });
        });
      });
  });
});

describe('GET /api/users/:username', () => {
  it('200: responds with a specified user by their username', () => {
    return request(app)
      .get('/api/users/butter_bridge')
      .expect(200)
      .then(({ body: { user } }) => {
        expect(user).toMatchObject({
          username: 'butter_bridge',
          avatar_url:
            'https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg',
          name: 'jonny',
        });
      });
  });
  it('404: responds with not found if username does not exist', () => {
    return request(app)
      .get('/api/users/iamnotarealuser')
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe('Not found');
      });
  });
});
