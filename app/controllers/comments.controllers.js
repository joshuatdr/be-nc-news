const {
  selectCommentsByArticle,
  insertComment,
  removeComment,
  updateComment,
} = require('../models/comments.models');
const { selectArticle } = require('../models/articles.models');

exports.getCommentsByArticle = (req, res, next) => {
  const { article_id } = req.params;
  const { limit, p } = req.query;
  Promise.all([
    selectCommentsByArticle(article_id, limit, p),
    selectArticle(article_id),
  ])
    .then(([comments]) => {
      res.status(200).send({ comments });
    })
    .catch((err) => next(err));
};

exports.postComment = (req, res, next) => {
  const { article_id } = req.params;
  const { username, body } = req.body;
  insertComment(body, article_id, username)
    .then((comment) => {
      res.status(201).send({ comment });
    })
    .catch((err) => next(err));
};

exports.deleteComment = (req, res, next) => {
  const { comment_id } = req.params;
  removeComment(comment_id)
    .then(() => {
      res.status(204).send();
    })
    .catch((err) => next(err));
};

exports.patchComment = (req, res, next) => {
  const { inc_votes } = req.body;
  const { comment_id } = req.params;
  updateComment(inc_votes, comment_id)
    .then((comment) => {
      res.status(200).send({ comment });
    })
    .catch((err) => next(err));
};
