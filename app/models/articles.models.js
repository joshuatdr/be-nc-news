const db = require('../../db/connection');
const { checkExists } = require('../utils');

exports.selectArticle = (article_id) => {
  return db
    .query(
      `SELECT articles.article_id, title, topic, articles.author, articles.body, articles.created_at, articles.votes, article_img_url, COUNT(comments.article_id)::INT AS comment_count 
       FROM articles LEFT JOIN comments ON articles.article_id = comments.article_id 
       WHERE articles.article_id = $1 
       GROUP BY articles.article_id`,
      [article_id]
    )
    .then(({ rows: [selectedArticle] }) => {
      if (!selectedArticle) {
        return Promise.reject({ status: 404, msg: 'Not found' });
      }
      return selectedArticle;
    });
};

exports.selectArticles = (
  sort_by = 'created_at',
  order = 'DESC',
  topic,
  limit = 10,
  p = 1
) => {
  const validLimit = Number(limit);
  const validOffset = Number(p);
  const validColumns = [
    'author',
    'title',
    'article_id',
    'topic',
    'created_at',
    'votes',
    'comment_count',
  ];
  const validOrder = ['ASC', 'DESC'];

  let queryStr = `
    SELECT articles.author, title, articles.article_id, topic, articles.created_at, articles.votes, article_img_url, COUNT(*) OVER()::INT AS total_count, COUNT(comments.article_id)::INT AS comment_count 
    FROM articles LEFT JOIN comments ON articles.article_id = comments.article_id`;
  let count = 1;
  const queryValues = [];
  const queryProms = [];

  if (
    !validColumns.includes(sort_by) ||
    !validOrder.includes(order.toUpperCase()) ||
    isNaN(validLimit) ||
    isNaN(validOffset) ||
    validLimit <= 0 ||
    validLimit > 10000 ||
    validOffset <= 0 ||
    validOffset > 10000
  ) {
    return Promise.reject({ status: 400, msg: 'Bad request' });
  }

  if (topic) {
    const checkTopic = checkExists('topics', 'slug', topic);
    queryValues.push(topic);
    queryProms.push(checkTopic);
    queryStr += ` WHERE topic = $${count}`;
    count++;
  }

  queryStr += ` GROUP BY articles.article_id ORDER BY ${sort_by} ${order} LIMIT $${count} OFFSET $${
    count + 1
  };`;
  queryValues.push(validLimit, (validOffset - 1) * validLimit);

  const dbQuery = db.query(queryStr, queryValues);
  queryProms.push(dbQuery);

  return Promise.all(queryProms).then((result) => {
    if (queryProms.length === 2) {
      if (!result[1].rows.length) {
        return Promise.reject({ status: 404, msg: 'Not found' });
      }
      const total_count = result[1].rows[0].total_count;
      const articles = result[1].rows.map((article) => {
        delete article.total_count;
        return article;
      });
      return [articles, total_count];
    }
    const total_count = result[0].rows[0].total_count;
    const articles = result[0].rows.map((article) => {
      delete article.total_count;
      return article;
    });
    return [articles, total_count];
  });
};

exports.updateArticle = (inc_votes, article_id) => {
  return db
    .query(
      `
      UPDATE articles 
      SET votes = votes + $1 
      WHERE article_id = $2
      RETURNING *`,
      [inc_votes, article_id]
    )
    .then(({ rows: [article] }) => {
      return article;
    });
};

exports.insertArticle = ({
  author,
  topic,
  title,
  body,
  article_img_url = 'https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700',
}) => {
  if (!author || !topic || !title || !body) {
    return Promise.reject({ status: 400, msg: 'Bad request' });
  }
  const checkAuthor = checkExists('users', 'username', author);
  const checkTopic = checkExists('topics', 'slug', topic);
  const dbQuery = db.query(
    `
      INSERT INTO articles 
        (author, topic, title, body, article_img_url) 
      VALUES 
        ($1, $2, $3, $4, $5) 
      RETURNING *;
      `,
    [author, topic, title, body, article_img_url]
  );
  return Promise.all([checkAuthor, checkTopic, dbQuery]).then((result) => {
    const [article] = result[2].rows;
    article.comment_count = 0;
    return article;
  });
};
