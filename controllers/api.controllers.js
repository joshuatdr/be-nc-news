const endpointsData = require('../endpoints.json');

exports.getEndpoints = (req, res) => {
  res.send({ endpoints: endpointsData });
};
