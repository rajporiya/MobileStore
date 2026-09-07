const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');

const categories = [
  { name: 'Apple', icon: '🍎', description: 'iPhone and Apple products' },
  { name: 'Samsung', icon: '🌟', description: 'Samsung Galaxy smartphones' },
  { name: 'iQOO', icon: '⚡', description: 'iQOO gaming smartphones' },
  { name: 'MI', icon: '🔥', description: 'Xiaomi MI smartphones' },
  { name: 'OPPO', icon: '📸', description: 'OPPO smartphones with great cameras' },
  { name: 'VIVO', icon: '🎵', description: 'VIVO smartphones' },
  { name: 'MOTOROLA', icon: '📱', description: 'Motorola smartphones' },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany();
    await Product.deleteMany();
    await User.deleteMany({ role: 'user' });
    console.log('Cleared existing data');

    // Create categories (use save() to trigger pre-save slug hook)
    const createdCategories = []
    for (const cat of categories) {
      const c = new Category(cat)
      await c.save()
      createdCategories.push(c)
    }
    const catMap = {};
    createdCategories.forEach((c) => (catMap[c.name] = c._id));
    console.log('Categories seeded');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@mobilestore.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@mobilestore.com',
        password: 'admin@123',
        role: 'admin',
      });
      console.log('Admin user created: admin@mobilestore.com / admin@123');
    }

    // Create demo user
    await User.create({
      name: 'Demo User',
      email: 'demo@mobilestore.com',
      password: 'demo@123',
      role: 'user',
    });

    // Create products
    const products = [
      // Apple
      {
        title: 'iPhone 15 Pro Max',
        brand: 'Apple',
        price: 134900,
        originalPrice: 159900,
        description: 'The most powerful iPhone ever with A17 Pro chip, titanium design, and 48MP camera system.',
        category: catMap['Apple'],
        images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500', public_id: '' }],
        specifications: [
          { key: 'Display', value: '6.7-inch Super Retina XDR' },
          { key: 'Chip', value: 'Apple A17 Pro' },
          { key: 'Camera', value: '48MP Main + 12MP Ultra Wide + 12MP 5x Telephoto' },
          { key: 'Battery', value: '4422 mAh' },
          { key: 'Storage', value: '256GB / 512GB / 1TB' },
          { key: 'RAM', value: '8GB' },
          { key: 'OS', value: 'iOS 17' },
        ],
        rating: 4.8,
        numReviews: 245,
        stock: 50,
        isFeatured: true,
        discount: 16,
      },
      {
        title: 'iPhone 15',
        brand: 'Apple',
        price: 79900,
        originalPrice: 89900,
        description: 'iPhone 15 with Dynamic Island, 48MP camera, and USB-C connector.',
        category: catMap['Apple'],
        images: [{ url: 'https://images.unsplash.com/photo-1696426115524-8ec7fc056a97?w=500', public_id: '' }],
        specifications: [
          { key: 'Display', value: '6.1-inch Super Retina XDR' },
          { key: 'Chip', value: 'Apple A16 Bionic' },
          { key: 'Camera', value: '48MP Main + 12MP Ultra Wide' },
          { key: 'Battery', value: '3877 mAh' },
          { key: 'Storage', value: '128GB / 256GB / 512GB' },
          { key: 'RAM', value: '6GB' },
          { key: 'OS', value: 'iOS 17' },
        ],
        rating: 4.7,
        numReviews: 189,
        stock: 75,
        isFeatured: true,
        discount: 11,
      },
      // Samsung
      {
        title: 'Samsung Galaxy S24 Ultra',
        brand: 'Samsung',
        price: 129999,
        originalPrice: 144999,
        description: 'Galaxy AI on the most powerful Galaxy S series ever, with built-in S Pen.',
        category: catMap['Samsung'],
        images: [{ url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500', public_id: '' }],
        specifications: [
          { key: 'Display', value: '6.8-inch QHD+ Dynamic AMOLED' },
          { key: 'Processor', value: 'Snapdragon 8 Gen 3' },
          { key: 'Camera', value: '200MP + 12MP + 10MP + 50MP' },
          { key: 'Battery', value: '5000 mAh' },
          { key: 'Storage', value: '256GB / 512GB / 1TB' },
          { key: 'RAM', value: '12GB' },
          { key: 'OS', value: 'Android 14, One UI 6.1' },
        ],
        rating: 4.8,
        numReviews: 312,
        stock: 40,
        isFeatured: true,
        discount: 10,
      },
      {
        title: 'Samsung Galaxy A55 5G',
        brand: 'Samsung',
        price: 38999,
        originalPrice: 44999,
        description: 'Awesome by design with Exynos 1480, 50MP OIS camera and 5000mAh battery.',
        category: catMap['Samsung'],
        images: [{ url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500', public_id: '' }],
        specifications: [
          { key: 'Display', value: '6.6-inch Super AMOLED FHD+' },
          { key: 'Processor', value: 'Exynos 1480' },
          { key: 'Camera', value: '50MP + 12MP + 5MP' },
          { key: 'Battery', value: '5000 mAh' },
          { key: 'Storage', value: '128GB / 256GB' },
          { key: 'RAM', value: '8GB' },
          { key: 'OS', value: 'Android 14, One UI 6.1' },
        ],
        rating: 4.4,
        numReviews: 178,
        stock: 90,
        isFeatured: false,
        discount: 13,
      },
      // iQOO
      {
        title: 'iQOO 12 5G',
        brand: 'iQOO',
        price: 52999,
        originalPrice: 59999,
        description: 'Legendary Performance. A Snapdragon 8 Gen 3 powered gaming beast.',
        category: catMap['iQOO'],
        images: [{ url: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=500', public_id: '' }],
        specifications: [
          { key: 'Display', value: '6.78-inch LTPO AMOLED 144Hz' },
          { key: 'Processor', value: 'Snapdragon 8 Gen 3' },
          { key: 'Camera', value: '50MP + 50MP + 64MP' },
          { key: 'Battery', value: '5000 mAh, 120W Flash Charge' },
          { key: 'Storage', value: '256GB / 512GB' },
          { key: 'RAM', value: '12GB / 16GB' },
          { key: 'OS', value: 'Android 14, FunTouch OS 14' },
        ],
        rating: 4.6,
        numReviews: 143,
        stock: 60,
        isFeatured: true,
        discount: 12,
      },
      // MI
      {
        title: 'Xiaomi 14 Ultra',
        brand: 'MI',
        price: 99999,
        originalPrice: 109999,
        description: 'Leica Summilux lens with top-tier photography and Snapdragon 8 Gen 3.',
        category: catMap['MI'],
        images: [{ url: 'https://images.unsplash.com/photo-1678685812737-2ae6ab6e89d9?w=500', public_id: '' }],
        specifications: [
          { key: 'Display', value: '6.73-inch LTPO AMOLED 2K 120Hz' },
          { key: 'Processor', value: 'Snapdragon 8 Gen 3' },
          { key: 'Camera', value: 'Leica 50MP + 50MP + 50MP' },
          { key: 'Battery', value: '5000 mAh, 90W Wired + 80W Wireless' },
          { key: 'Storage', value: '256GB / 512GB' },
          { key: 'RAM', value: '16GB' },
          { key: 'OS', value: 'Android 14, HyperOS' },
        ],
        rating: 4.7,
        numReviews: 98,
        stock: 30,
        isFeatured: true,
        discount: 9,
      },
      {
        title: 'Redmi Note 13 Pro 5G',
        brand: 'MI',
        price: 26999,
        originalPrice: 31999,
        description: '200MP OIS Camera, Snapdragon 7s Gen 2, Curved AMOLED display.',
        category: catMap['MI'],
        images: [{ url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', public_id: '' }],
        specifications: [
          { key: 'Display', value: '6.67-inch Curved AMOLED 1.5K 120Hz' },
          { key: 'Processor', value: 'Snapdragon 7s Gen 2' },
          { key: 'Camera', value: '200MP + 8MP + 2MP' },
          { key: 'Battery', value: '5100 mAh, 67W Fast Charge' },
          { key: 'Storage', value: '128GB / 256GB' },
          { key: 'RAM', value: '8GB / 12GB' },
          { key: 'OS', value: 'Android 13, MIUI 14' },
        ],
        rating: 4.5,
        numReviews: 267,
        stock: 120,
        isFeatured: true,
        discount: 16,
      },
      // OPPO
      {
        title: 'OPPO Find X7 Ultra',
        brand: 'OPPO',
        price: 89999,
        originalPrice: 99999,
        description: 'Hasselblad Camera, Snapdragon 8 Gen 3, and 100W SUPERVOOC charging.',
        category: catMap['OPPO'],
        images: [{ url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500', public_id: '' }],
        specifications: [
          { key: 'Display', value: '6.82-inch LTPO AMOLED 2K 120Hz' },
          { key: 'Processor', value: 'Snapdragon 8 Gen 3' },
          { key: 'Camera', value: 'Hasselblad 50MP + 50MP + 50MP + 50MP' },
          { key: 'Battery', value: '5000 mAh, 100W SUPERVOOC' },
          { key: 'Storage', value: '256GB / 512GB' },
          { key: 'RAM', value: '12GB / 16GB' },
          { key: 'OS', value: 'Android 14, ColorOS 14' },
        ],
        rating: 4.6,
        numReviews: 87,
        stock: 35,
        isFeatured: false,
        discount: 10,
      },
      // VIVO
      {
        title: 'Vivo X100 Pro',
        brand: 'VIVO',
        price: 89999,
        originalPrice: 94999,
        description: 'ZEISS Telephoto Camera, Dimensity 9300 chip, 100W FlashCharge.',
        category: catMap['VIVO'],
        images: [{ url: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=500', public_id: '' }],
        specifications: [
          { key: 'Display', value: '6.78-inch LTPO AMOLED 2K 120Hz' },
          { key: 'Processor', value: 'Dimensity 9300' },
          { key: 'Camera', value: 'ZEISS 50MP + 50MP + 64MP' },
          { key: 'Battery', value: '5400 mAh, 100W FlashCharge' },
          { key: 'Storage', value: '256GB / 512GB' },
          { key: 'RAM', value: '12GB / 16GB' },
          { key: 'OS', value: 'Android 14, OriginOS 4' },
        ],
        rating: 4.5,
        numReviews: 112,
        stock: 45,
        isFeatured: false,
        discount: 5,
      },
      // MOTOROLA
      {
        title: 'Motorola Edge 50 Pro',
        brand: 'MOTOROLA',
        price: 31999,
        originalPrice: 39999,
        description: '125W TurboPower charge, 50MP OIS camera, Snapdragon 7s Gen 2.',
        category: catMap['MOTOROLA'],
        images: [{ url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500', public_id: '' }],
        specifications: [
          { key: 'Display', value: '6.7-inch pOLED 144Hz 1.5K' },
          { key: 'Processor', value: 'Snapdragon 7s Gen 2' },
          { key: 'Camera', value: '50MP + 13MP + 10MP OIS' },
          { key: 'Battery', value: '4500 mAh, 125W TurboPower' },
          { key: 'Storage', value: '256GB' },
          { key: 'RAM', value: '12GB' },
          { key: 'OS', value: 'Android 14' },
        ],
        rating: 4.4,
        numReviews: 156,
        stock: 80,
        isFeatured: true,
        discount: 20,
      },
    ];

    await Product.insertMany(products);
    console.log(`${products.length} products seeded`);
    console.log('\n✅ Database seeded successfully!');
    console.log('Admin: admin@mobilestore.com / admin@123');
    console.log('Demo user: demo@mobilestore.com / demo@123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
