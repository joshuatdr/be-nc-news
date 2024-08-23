const { selectTopics } = require('../models/topics.models');

exports.getTopics = (req, res, next) => {
  selectTopics().then((rows) => {
    res.send({ topics: rows });
  });
};
