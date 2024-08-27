const express = require('express');
const app = express();
const {
  getTopics,
  getEndpoints,
  getArticles,
  getArticle,
} = require('./controllers/topics.controllers');
const {
  psqlErrorHandler,
  customErrorHandler,
  serverErrorHandler,
} = require('./errors');

app.get('/api', getEndpoints);

app.get('/api/topics', getTopics);

app.get('/api/articles', getArticles);

app.get('/api/articles/:article_id', getArticle);

app.use(psqlErrorHandler);
app.use(customErrorHandler);
app.use(serverErrorHandler);

module.exports = app;
