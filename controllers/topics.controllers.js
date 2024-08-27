const { selectTopics } = require('../models/topics.models');
const endpointsData = require('../endpoints.json');

exports.getTopics = (req, res, next) => {
  selectTopics().then((rows) => {
    res.send({ topics: rows });
  });
};

exports.getEndpoints = (req, res) => {
  res.send({ endpoints: endpointsData });
};
