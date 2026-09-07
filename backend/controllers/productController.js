const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc  Get all products with filters, search, pagination
// @route GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 12;
  const page = Number(req.query.page) || 1;

  const keyword = req.query.search
    ? {
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { brand: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  const brandFilter = req.query.brand
    ? { brand: { $regex: req.query.brand, $options: 'i' } }
    : {};

  const categoryFilter = req.query.category ? { category: req.query.category } : {};

  const priceFilter =
    req.query.minPrice || req.query.maxPrice
      ? {
          price: {
            ...(req.query.minPrice && { $gte: Number(req.query.minPrice) }),
            ...(req.query.maxPrice && { $lte: Number(req.query.maxPrice) }),
          },
        }
      : {};

  const featuredFilter =
    req.query.featured === 'true' ? { isFeatured: true } : {};

  const filter = {
    ...keyword,
    ...brandFilter,
    ...categoryFilter,
    ...priceFilter,
    ...featuredFilter,
  };

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1 },
  };
  const sortBy = sortOptions[req.query.sort] || { createdAt: -1 };

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort(sortBy)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    success: true,
    data: products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc  Get single product by ID
// @route GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    'category',
    'name slug'
  );

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json({ success: true, data: product });
});

// @desc  Create product
// @route POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const {
    title, brand, price, originalPrice, description, category,
    specifications, stock, isFeatured, discount, tags,
  } = req.body;

  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      public_id: file.filename,
    }));
  } else if (req.body.images) {
    // Support for base64 or external URLs passed as JSON
    const rawImages = typeof req.body.images === 'string'
      ? JSON.parse(req.body.images)
      : req.body.images;
    images = Array.isArray(rawImages)
      ? rawImages.map((img) =>
          typeof img === 'string' ? { url: img, public_id: '' } : img
        )
      : [];
  }

  const product = await Product.create({
    title, brand, price, originalPrice, description, category,
    images,
    specifications: specifications ? (
      typeof specifications === 'string' ? JSON.parse(specifications) : specifications
    ) : [],
    stock: stock || 0,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    discount: discount || 0,
    tags: tags || [],
  });

  const populated = await product.populate('category', 'name slug');
  res.status(201).json({ success: true, data: populated });
});

// @desc  Update product
// @route PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const fields = [
    'title', 'brand', 'price', 'originalPrice', 'description',
    'category', 'stock', 'isFeatured', 'discount',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  if (req.body.specifications) {
    product.specifications =
      typeof req.body.specifications === 'string'
        ? JSON.parse(req.body.specifications)
        : req.body.specifications;
  }

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      public_id: file.filename,
    }));
    product.images = [...product.images, ...newImages];
  }

  const updated = await product.save();
  const populated = await updated.populate('category', 'name slug');
  res.json({ success: true, data: populated });
});

// @desc  Delete product
// @route DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted successfully' });
});

// @desc  Create product review
// @route POST /api/products/:id/reviews
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  product.reviews.push(review);
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.reduce((acc, r) => r.rating + acc, 0) /
    product.reviews.length;

  await product.save();
  res.status(201).json({ success: true, message: 'Review added' });
});

// @desc  Get featured products
// @route GET /api/products/featured
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true })
    .populate('category', 'name slug')
    .limit(8)
    .sort({ createdAt: -1 });
  res.json({ success: true, data: products });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getFeaturedProducts,
};
