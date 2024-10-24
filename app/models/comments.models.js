const db = require('../../db/connection');

exports.selectCommentsByArticle = (article_id, limit = 10, p = 1) => {
  const validLimit = Number(limit);
  const validOffset = Number(p);
  if (
    isNaN(validLimit) ||
    isNaN(validOffset) ||
    validLimit < 0 ||
    validLimit > 10000 ||
    validOffset < 0 ||
    validOffset > 10000
  ) {
    return Promise.reject({ status: 400, msg: 'Bad request' });
  }
  return db
    .query(
      `SELECT * FROM comments 
       WHERE article_id = $1 
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3;`,
      [article_id, validLimit, (validOffset - 1) * validLimit]
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.insertComment = (body, article_id, username) => {
  return db
    .query(
      `INSERT INTO comments 
        (body, article_id, author) 
       VALUES
        ($1, $2, $3) 
       RETURNING *`,
      [body, article_id, username]
    )
    .then(({ rows: [comment] }) => {
      return comment;
    });
};

exports.removeComment = (comment_id) => {
  return db
    .query(
      `DELETE FROM comments 
       WHERE comment_id = $1 
       RETURNING *`,
      [comment_id]
    )
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({ status: 404, msg: 'Not found' });
      }
    });
};

exports.updateComment = (inc_votes, comment_id) => {
  return db
    .query(
      `UPDATE comments
       SET votes = votes + $1 
       WHERE comment_id = $2 
       RETURNING *`,
      [inc_votes, comment_id]
    )
    .then(({ rows: [comment] }) => {
      if (!comment) {
        return Promise.reject({ status: 404, msg: 'Not found' });
      }
      return comment;
    });
};
