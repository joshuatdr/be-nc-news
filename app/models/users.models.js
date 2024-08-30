const db = require('../../db/connection');

exports.selectUsers = () => {
  return db
    .query(
      `
      SELECT username, name, avatar_url 
      FROM users`
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.selectUser = (username) => {
  return db
    .query(
      `
      SELECT username, name, avatar_url FROM users 
      WHERE username = $1`,
      [username]
    )
    .then(({ rows: [user] }) => {
      return user;
    });
};
