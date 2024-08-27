const { selectTopics, selectArticle } = require('../models/topics.models');
const endpointsData = require('../endpoints.json');

exports.getTopics = (req, res, next) => {
  selectTopics().then((rows) => {
    res.send({ topics: rows });
  });
};

exports.getEndpoints = (req, res) => {
  res.send({ endpoints: endpointsData });
};

exports.getArticle = (req, res) => {
  const { article_id } = req.params;
  selectArticle(article_id).then((selectedArticle) => {
    res.send({ article: selectedArticle });
  });
};
