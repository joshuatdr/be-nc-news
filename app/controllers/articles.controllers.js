const {
  selectArticle,
  selectArticles,
  updateArticle,
} = require('../models/articles.models');

exports.getArticle = (req, res, next) => {
  const { article_id } = req.params;
  selectArticle(article_id)
    .then((article) => {
      res.status(200).send({ article });
    })
    .catch((err) => next(err));
};

exports.getArticles = (req, res, next) => {
  const { sort_by, order, topic } = req.query;
  selectArticles(sort_by, order, topic)
    .then((articles) => {
      res.status(200).send({ articles });
    })
    .catch((err) => next(err));
};

exports.patchArticle = (req, res, next) => {
  const { inc_votes } = req.body;
  const { article_id } = req.params;
  Promise.all([updateArticle(inc_votes, article_id), selectArticle(article_id)])
    .then(([article]) => {
      res.status(200).send({ article });
    })
    .catch((err) => next(err));
};
