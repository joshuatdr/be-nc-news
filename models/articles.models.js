const db = require('../db/connection');
const { checkExists } = require('../utils');

exports.selectArticle = (article_id) => {
  return db
    .query(
      `SELECT articles.article_id, title, topic, articles.author, articles.body, articles.created_at, articles.votes, article_img_url, COUNT(comments.article_id)::INT AS comment_count FROM articles LEFT JOIN comments ON articles.article_id = comments.article_id WHERE articles.article_id = $1 GROUP BY articles.article_id`,
      [article_id]
    )
    .then(({ rows: [selectedArticle] }) => {
      if (!selectedArticle) {
        return Promise.reject({ status: 404, msg: 'Not found' });
      }
      return selectedArticle;
    });
};

exports.selectArticles = (sort_by = 'created_at', order = 'DESC', topic) => {
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
    SELECT articles.author, title, articles.article_id, topic, articles.created_at, articles.votes, article_img_url, COUNT(comments.article_id)::INT AS comment_count 
    FROM articles LEFT JOIN comments ON articles.article_id = comments.article_id`;
  const queryValues = [];

  if (topic) {
    queryValues.push(topic);
    queryStr += ` WHERE topic = $1`;
  }

  if (
    !validColumns.includes(sort_by) ||
    !validOrder.includes(order.toUpperCase())
  ) {
    return Promise.reject({ status: 400, msg: 'Bad request' });
  }

  queryStr += ` GROUP BY articles.article_id ORDER BY ${sort_by} ${order}`;

  return db.query(queryStr, queryValues).then(({ rows }) => {
    if (!rows.length) {
      return checkExists('topics', 'slug', topic).then(() => {
        return Promise.reject({ status: 404, msg: 'Not found' });
      });
    }
    return rows;
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
