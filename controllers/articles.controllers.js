const {
  selectArticle,
  selectArticles,
  updateArticle,
} = require('../models/articles.models');

exports.getArticle = (req, res, next) => {
  const { article_id } = req.params;
  selectArticle(article_id)
    .then((selectedArticle) => {
      res.send({ article: selectedArticle });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getArticles = (req, res) => {
  selectArticles().then((rows) => {
    res.status(200).send({ articles: rows });
  });
};

exports.patchArticle = (req, res, next) => {
  const { inc_votes } = req.body;
  const { article_id } = req.params;
  updateArticle(inc_votes, article_id)
    .then((article) => {
      res.status(200).send({ article: article });
    })
    .catch((err) => {
      next(err);
    });
};
