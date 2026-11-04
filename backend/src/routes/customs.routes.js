const express = require('express');
const customsController = require('../controllers/customs.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'customs'), customsController.getAllDeclarations)
  .post(authorize('admin', 'operator'), customsController.createDeclaration);

router.patch('/:id/review', authorize('admin', 'customs'), customsController.reviewDeclaration);

module.exports = router;
