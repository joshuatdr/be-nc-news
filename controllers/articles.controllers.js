const { selectArticle, selectArticles } = require('../models/articles.models');

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
