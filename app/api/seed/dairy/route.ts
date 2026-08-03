import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

const DAIRY_PRODUCTS = [
  {
    product_name: 'Fresh Full Cream Milk',
    category: 'Dairy',
    subcategory: 'Milk',
    brand: 'Farm Fresh',
    mrp: 65,
    selling_price: 58,
    gst: 0,
    total_amt: 58,
    quantity: '1 Litre',
    stock_status: 1,
    product_description: 'Pure, fresh full-cream cow milk sourced directly from local farms. Rich in calcium and essential vitamins.',
    product_image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop'],
    is_active: '1',
  },
  {
    product_name: 'Desi Cow Ghee',
    category: 'Dairy',
    subcategory: 'Ghee',
    brand: 'Pure Organic',
    mrp: 950,
    selling_price: 849,
    gst: 5,
    total_amt: 849,
    quantity: '500 ml',
    stock_status: 1,
    product_description: 'Hand-churned bilona ghee made from pure desi cow milk. Rich in healthy fats and has a distinctive aroma.',
    product_image: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=500&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=500&auto=format&fit=crop'],
    is_active: '1',
  },
  {
    product_name: 'Homemade Paneer',
    category: 'Dairy',
    subcategory: 'Paneer',
    brand: 'Farm Fresh',
    mrp: 110,
    selling_price: 95,
    gst: 0,
    total_amt: 95,
    quantity: '200 g',
    stock_status: 1,
    product_description: 'Soft, fresh paneer prepared daily from full-fat cow milk. Perfect for curries, tikkas, and snacks.',
    product_image: 'https://images.unsplash.com/photo-1631452180539-96eca7d73c8c?w=500&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1631452180539-96eca7d73c8c?w=500&auto=format&fit=crop'],
    is_active: '1',
  },
  {
    product_name: 'Natural Curd (Dahi)',
    category: 'Dairy',
    subcategory: 'Curd',
    brand: 'Farm Fresh',
    mrp: 55,
    selling_price: 48,
    gst: 0,
    total_amt: 48,
    quantity: '400 g',
    stock_status: 1,
    product_description: 'Thick, creamy, naturally set curd made from pure whole milk. High in probiotics, great for digestion.',
    product_image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop'],
    is_active: '1',
  },
  {
    product_name: 'Fresh Butter (Makhan)',
    category: 'Dairy',
    subcategory: 'Butter',
    brand: 'Pure Organic',
    mrp: 85,
    selling_price: 72,
    gst: 0,
    total_amt: 72,
    quantity: '100 g',
    stock_status: 1,
    product_description: 'Churned white butter from farm-fresh cream. No preservatives, no artificial colour — just pure makhan.',
    product_image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop'],
    is_active: '1',
  },
  {
    product_name: 'Lassi (Sweet)',
    category: 'Dairy',
    subcategory: 'Drinks',
    brand: 'Farm Fresh',
    mrp: 40,
    selling_price: 35,
    gst: 0,
    total_amt: 35,
    quantity: '250 ml',
    stock_status: 1,
    product_description: 'Thick, chilled sweet lassi blended from fresh curd and sugar. A classic refreshing drink.',
    product_image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&auto=format&fit=crop'],
    is_active: '1',
  },
  {
    product_name: 'Mozzarella Cheese',
    category: 'Dairy',
    subcategory: 'Cheese',
    brand: 'Artisan Dairy',
    mrp: 180,
    selling_price: 155,
    gst: 5,
    total_amt: 155,
    quantity: '200 g',
    stock_status: 1,
    product_description: 'Fresh mozzarella cheese, soft and milky. Ideal for pizzas, pasta, and salads.',
    product_image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&auto=format&fit=crop'],
    is_active: '1',
  },
  {
    product_name: 'Cow Milk (Toned)',
    category: 'Dairy',
    subcategory: 'Milk',
    brand: 'Farm Fresh',
    mrp: 54,
    selling_price: 48,
    gst: 0,
    total_amt: 48,
    quantity: '1 Litre',
    stock_status: 1,
    product_description: 'Toned cow milk with reduced fat content, ideal for health-conscious families and children.',
    product_image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop'],
    is_active: '1',
  },
];

export async function GET() {
  try {
    await connectDB();

    // Avoid duplicate seeding — check if dairy products already exist
    const existing = await Product.countDocuments({ category: 'Dairy' });
    if (existing > 0) {
      return NextResponse.json({
        message: `Dairy products already exist (${existing} found). Delete them first if you want to re-seed.`,
        count: existing,
      });
    }

    const inserted = await Product.insertMany(DAIRY_PRODUCTS);

    return NextResponse.json({
      message: `✅ Successfully seeded ${inserted.length} dairy products.`,
      count: inserted.length,
      products: inserted.map((p: any) => ({ _id: p._id, name: p.product_name })),
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
