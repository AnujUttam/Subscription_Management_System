const express = require('express');
const router = express.Router();
const { listProducts, createProduct, updateProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'staff'));

router.get('/', listProducts);
router.post('/', createProduct);
router.patch('/:id', updateProduct);

module.exports = router;
