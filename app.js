const express = require('express');
const app = express();

const {
  apiControllers: { getEndpoints },
  topicControllers: { getTopics },
  articleControllers: { getArticles, getArticle },
  commentControllers: { getCommentsByArticle, postComment },
} = require('./controllers');

const {
  psqlErrorHandler,
  customErrorHandler,
  serverErrorHandler,
} = require('./errors');

app.use(express.json());

app.get('/api', getEndpoints);

app.get('/api/topics', getTopics);

app.get('/api/articles', getArticles);

app.get('/api/articles/:article_id', getArticle);

app.get('/api/articles/:article_id/comments', getCommentsByArticle);

app.post('/api/articles/:article_id/comments', postComment);

app.use(psqlErrorHandler);
app.use(customErrorHandler);
app.use(serverErrorHandler);

module.exports = app;
