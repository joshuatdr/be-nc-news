const express = require('express');
const app = express();
const {
  getTopics,
  getEndpoints,
  getArticle,
} = require('./controllers/topics.controllers');

app.get('/api', getEndpoints);

app.get('/api/topics', getTopics);

app.get('/api/articles/:article_id', getArticle);

module.exports = app;
