const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

const uploadedImages = (files) =>
  (files || []).map((file) => ({
    url: `/uploads/${file.filename}`,
    public_id: file.filename,
  }));

// Accepts a JSON array of strings, a JSON array of {url} objects, or a
// comma-separated string of URLs.
const parseImages = (raw) => {
  if (!raw) return [];
  let value = raw;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    value = trimmed.startsWith('[') ? JSON.parse(trimmed) : trimmed.split(',');
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((img) => (typeof img === 'string' ? img.trim() : img?.url))
    .filter((url) => typeof url === 'string' && url)
    .map((url) => ({ url, public_id: '' }));
};

const parseSpecifications = (raw) => {
  if (!raw) return [];
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!Array.isArray(value)) return [];
  return value
    .map((spec) => ({ key: spec?.key || spec?.name || '', value: spec?.value || '' }))
    .filter((spec) => spec.key);
};

const toBool = (value) => value === true || value === 'true';

// User input goes straight into a $regex, so metacharacters are escaped first.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc  Get all products with filters, search, pagination
// @route GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 12;
  const page = Number(req.query.page) || 1;

  const search = req.query.search?.trim();
  const keyword = search
    ? {
        $or: [
          { title: { $regex: escapeRegex(search), $options: 'i' } },
          { brand: { $regex: escapeRegex(search), $options: 'i' } },
          { description: { $regex: escapeRegex(search), $options: 'i' } },
        ],
      }
    : {};

  const brandFilter = req.query.brand
    ? { brand: { $regex: escapeRegex(req.query.brand.trim()), $options: 'i' } }
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

  // Availability split for the admin catalogue filters.
  const availabilityFilter =
    req.query.availability === 'in'
      ? { stock: { $gt: 0 } }
      : req.query.availability === 'out'
        ? { stock: { $lte: 0 } }
        : req.query.availability === 'low'
          ? { stock: { $gt: 0, $lte: 3 } }
          : {};

  const dateFilter =
    req.query.dateFrom || req.query.dateTo
      ? {
          createdAt: {
            ...(req.query.dateFrom && { $gte: new Date(req.query.dateFrom) }),
            ...(req.query.dateTo && { $lte: new Date(req.query.dateTo) }),
          },
        }
      : {};

  const filter = {
    ...keyword,
    ...brandFilter,
    ...categoryFilter,
    ...priceFilter,
    ...featuredFilter,
    ...availabilityFilter,
    ...dateFilter,
  };

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    name: { title: 1 },
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
    specifications, stock, isFeatured, discount, tags, sku,
  } = req.body;

  // Uploaded files win; otherwise fall back to whatever URLs were supplied.
  const images = req.files && req.files.length > 0
    ? uploadedImages(req.files)
    : parseImages(req.body.imageUrls || req.body.images);

  const product = await Product.create({
    title, brand, price, originalPrice, description, category,
    images,
    specifications: parseSpecifications(specifications),
    stock: stock || 0,
    isFeatured: toBool(isFeatured),
    exchangeEnabled: toBool(req.body.exchangeEnabled),
    discount: discount || 0,
    sku: (sku || '').trim(),
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
    'category', 'stock', 'isFeatured', 'discount', 'sku',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  if (req.body.exchangeEnabled !== undefined) {
    product.exchangeEnabled = toBool(req.body.exchangeEnabled);
  }

  if (req.body.specifications) {
    product.specifications = parseSpecifications(req.body.specifications);
  }

  // Explicitly supplied URLs replace the gallery; uploaded files append to it.
  if (req.body.imageUrls !== undefined || req.body.images !== undefined) {
    product.images = parseImages(req.body.imageUrls || req.body.images);
  }

  if (req.files && req.files.length > 0) {
    product.images = [...product.images, ...uploadedImages(req.files)];
  }

  const updated = await product.save();
  const populated = await updated.populate('category', 'name slug');
  res.json({ success: true, data: populated });
});

// @desc  Turn exchange on or off for a phone (admin)
// @route PUT /api/products/:id/exchange
const toggleProductExchange = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  product.exchangeEnabled =
    req.body.exchangeEnabled !== undefined
      ? toBool(req.body.exchangeEnabled)
      : !product.exchangeEnabled;

  const updated = await product.save();
  res.json({
    success: true,
    message: updated.exchangeEnabled
      ? 'Exchange enabled for this phone'
      : 'Exchange disabled for this phone',
    data: updated,
  });
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
  toggleProductExchange,
  deleteProduct,
  createProductReview,
  getFeaturedProducts,
};
