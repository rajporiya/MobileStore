const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Product = require('../models/Product');

// User input goes straight into a $regex, so metacharacters are escaped first.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc  Get all categories
// @route GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, data: categories });
});

// @desc  Get all categories (admin - including inactive, with product counts)
// @route GET /api/categories/all
const getAllCategories = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim();
  const filter = search
    ? (() => {
        const safe = escapeRegex(search);
        return {
          $or: [
            { name: { $regex: safe, $options: 'i' } },
            { description: { $regex: safe, $options: 'i' } },
          ],
        };
      })()
    : {};

  const [categories, counts] = await Promise.all([
    Category.find(filter).sort({ createdAt: -1 }),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);

  const countByCategory = Object.fromEntries(
    counts.map((row) => [String(row._id), row.count])
  );

  res.json({
    success: true,
    data: categories.map((category) => ({
      ...category.toObject(),
      productCount: countByCategory[String(category._id)] || 0,
    })),
  });
});

// @desc  Get single category
// @route GET /api/categories/:id
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, data: category });
});

// @desc  Create category
// @route POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, image, description } = req.body;

  const exists = await Category.findOne({ name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') } });
  if (exists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  const category = await Category.create({ name, icon, image, description });
  res.status(201).json({ success: true, data: category });
});

// @desc  Update category
// @route PUT /api/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const { name, icon, image, description, isActive } = req.body;
  if (name) category.name = name;
  if (icon !== undefined) category.icon = icon;
  if (image !== undefined) category.image = image;
  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  const updated = await category.save();
  res.json({ success: true, data: updated });
});

// @desc  Delete category
// @route DELETE /api/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Deleting a category out from under its phones would orphan them.
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    res.status(400);
    throw new Error(
      `Cannot delete "${category.name}" — ${productCount} phone${
        productCount === 1 ? '' : 's'
      } still use this category. Move or delete them first.`
    );
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted successfully' });
});

module.exports = {
  getCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
