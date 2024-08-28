const { selectTopics } = require('../models/topics.models');

exports.getTopics = (req, res) => {
  selectTopics().then((rows) => {
    res.send({ topics: rows });
  });
};
