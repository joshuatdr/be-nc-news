const { selectUsers, selectUser } = require('../models/users.models');
const { checkExists } = require('../utils');

exports.getUsers = (req, res) => {
  selectUsers().then((users) => {
    res.status(200).send({ users });
  });
};

exports.getUser = (req, res, next) => {
  const { username } = req.params;
  const dbQuery = selectUser(username);
  const checkUsername = checkExists('users', 'username', username);
  Promise.all([dbQuery, checkUsername])
    .then(([user]) => {
      res.status(200).send({ user });
    })
    .catch((err) => next(err));
};
