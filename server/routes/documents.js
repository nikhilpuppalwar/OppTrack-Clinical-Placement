const express = require('express');
const router = express.Router();
const { getDocuments, addDocument, updateDocument, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getDocuments).post(protect, addDocument);
router.route('/:id').put(protect, updateDocument).delete(protect, deleteDocument);

module.exports = router;
