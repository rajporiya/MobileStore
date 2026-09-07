const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');

dotenv.config();

async function clearStoreData() {
  await mongoose.connect(process.env.MONGO_URI);
  const [products, categories, users, orders] = await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({ role: { $ne: 'admin' } }),
    Order.deleteMany({}),
  ]);

  console.log(JSON.stringify({
    products: products.deletedCount,
    categories: categories.deletedCount,
    nonAdminUsers: users.deletedCount,
    orders: orders.deletedCount,
  }));
  await mongoose.disconnect();
}

clearStoreData().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
