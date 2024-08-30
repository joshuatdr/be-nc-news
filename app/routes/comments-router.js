const commentsRouter = require('express').Router();

const { deleteComment } = require('../controllers/comments.controllers');

commentsRouter.route('/:comment_id').delete(deleteComment);

module.exports = commentsRouter;
