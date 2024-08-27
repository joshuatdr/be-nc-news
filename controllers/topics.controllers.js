const {
  selectTopics,
  selectArticle,
  selectArticles,
} = require('../models/topics.models');
const endpointsData = require('../endpoints.json');

exports.getTopics = (req, res) => {
  selectTopics().then((rows) => {
    res.send({ topics: rows });
  });
};

exports.getEndpoints = (req, res) => {
  res.send({ endpoints: endpointsData });
};

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
