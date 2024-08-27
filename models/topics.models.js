const db = require('../db/connection');

exports.selectTopics = () => {
  return db.query(`SELECT * FROM topics`).then(({ rows }) => {
    return rows;
  });
};

exports.selectArticle = (article_id) => {
  return db
    .query(`SELECT * FROM articles WHERE article_id = $1`, [article_id])
    .then(({ rows: [selectedArticle] }) => {
      if (!selectedArticle) {
        return Promise.reject({ status: 404, msg: 'Not found' });
      }
      return selectedArticle;
    });
};

exports.selectArticles = () => {
  const pendingProms = [];
  pendingProms.push(
    db.query(
      `SELECT COUNT(comments.article_id) AS comment_count, articles.article_id
      FROM articles JOIN comments ON articles.article_id = comments.article_id
      GROUP BY articles.article_id`
    )
  );
  pendingProms.push(
    db.query(
      `SELECT author, title, article_id, topic, created_at, votes, article_img_url FROM articles ORDER BY created_at DESC`
    )
  );
  return Promise.all(pendingProms).then(
    ([{ rows: commentCounts }, { rows: articles }]) => {
      for (article of articles) {
        const articleCommentCount = commentCounts.find(
          ({ article_id }) => article_id === article.article_id
        );
        article.comment_count = articleCommentCount
          ? +articleCommentCount.comment_count
          : 0;
      }
      return articles;
    }
  );
};

exports.selectCommentsByArticle = (article_id) => {
  return db
    .query(
      `SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at DESC`,
      [article_id]
    )
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({ status: 404, msg: 'Not found' });
      }
      return rows;
    });
};
