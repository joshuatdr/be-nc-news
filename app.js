const express = require('express');
const app = express();
const endpoints = require('./endpoints.json');

const {
  topicControllers: { getTopics },
  articleControllers: { getArticles, getArticle, patchArticle },
  commentControllers: { getCommentsByArticle, postComment, deleteComment },
  userControllers: { getUsers },
} = require('./controllers');

const {
  psqlErrorHandler,
  customErrorHandler,
  serverErrorHandler,
} = require('./errors');

app.use(express.json());

app.get('/api', (req, res) => {
  res.status(200).send({ endpoints });
});

app.get('/api/topics', getTopics);

app.get('/api/articles', getArticles);

app.get('/api/articles/:article_id', getArticle);

app.patch('/api/articles/:article_id', patchArticle);

app.get('/api/articles/:article_id/comments', getCommentsByArticle);

app.post('/api/articles/:article_id/comments', postComment);

app.delete('/api/comments/:comment_id', deleteComment);

app.get('/api/users', getUsers);

app.use(psqlErrorHandler);
app.use(customErrorHandler);
app.use(serverErrorHandler);

module.exports = app;
