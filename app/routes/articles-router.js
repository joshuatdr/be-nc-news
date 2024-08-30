const articlesRouter = require('express').Router();

const {
  getArticles,
  getArticle,
  patchArticle,
} = require('../controllers/articles.controllers');

const {
  getCommentsByArticle,
  postComment,
} = require('../controllers/comments.controllers');

articlesRouter.get('/', getArticles);

articlesRouter
  .route('/:article_id')
  .get(getArticle)
  .patch(patchArticle);

articlesRouter
  .route('/:article_id/comments')
  .get(getCommentsByArticle)
  .post(postComment);

module.exports = articlesRouter;
