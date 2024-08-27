const express = require('express');
const app = express();
const { getTopics, getEndpoints } = require('./controllers/topics.controllers');

app.get('/api', getEndpoints);

app.get('/api/topics', getTopics);

module.exports = app;
