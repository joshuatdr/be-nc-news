const express = require('express');
const app = express();
const {
  getTopics,
  getEndpoints,
  getArticle,
} = require('./controllers/topics.controllers');
const { psqlErrorHandler } = require('./errors');

app.get('/api', getEndpoints);

app.get('/api/topics', getTopics);

app.get('/api/articles/:article_id', getArticle);

app.use(psqlErrorHandler);

module.exports = app;
