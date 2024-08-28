const {
  selectCommentsByArticle,
  insertComment,
} = require('../models/comments.models');

exports.getCommentsByArticle = (req, res, next) => {
  const { article_id } = req.params;
  selectCommentsByArticle(article_id)
    .then((comments) => {
      res.status(200).send({ comments: comments });
    })
    .catch((err) => {
      next(err);
    });
};

exports.postComment = (req, res, next) => {
  const { article_id } = req.params;
  const { username, body } = req.body;
  insertComment(body, article_id, username)
    .then((comment) => {
      res.status(201).send({ comment: comment });
    })
    .catch((err) => next(err));
};
