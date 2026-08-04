'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';
import { Leaf, ShieldCheck, Truck, Droplets, UserCheck, Star, Quote, Clock, MapPin, CalendarRange, CheckCircle2, ArrowRight, PackageSearch } from 'lucide-react';
import { blogs } from '@/lib/blogs';

const CATEGORY_ORDER = [
  'Vegetables',
  'Exotic Vegetables',
  'Leafy Greens',
  'Root Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Herbs & Spices',
  'Organic Daals',
  'Seeds'
];

const categoryImageMap: Record<string, string> = {
  'Vegetables': 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&auto=format&fit=crop&q=80',
  'Exotic Vegetables': 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&auto=format&fit=crop&q=80',
  'Leafy Greens': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80',
  'Root Vegetables': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80',
  'Fruits': 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&auto=format&fit=crop&q=80',
  'Dairy & Eggs': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&auto=format&fit=crop&q=80',
  'Herbs & Spices': 'https://images.unsplash.com/photo-1596003906949-67221c37965c?w=400&auto=format&fit=crop&q=80',
  'Organic Daals': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
  'Seeds': 'https://images.unsplash.com/photo-1502741126161-b048400d085d?w=400&auto=format&fit=crop&q=80'
};

// Dummy fallback categories and products if API fails
const dummyProducts: any[] = [];
const dummyCategories: any[] = [];

export default function Home() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const alwaysVisibleCategorySlugs = new Set(['organic-daals']);

  const faqs = [
    { question: 'What makes your Desi Ghee different from store-bought brands?', answer: 'Our Desi Ghee is made using the traditional Bilona method from grass-fed cows. It contains no preservatives or artificial flavors, ensuring maximum purity and nutrition.' },
    { question: 'Are your Cold Pressed Oils truly chemical-free?', answer: 'Yes, our oils are extracted using traditional wooden ghani methods at low temperatures without any chemical solvents, preserving their natural aroma, taste, and nutrients.' },
    { question: 'How do you verify the "Organic" status of your pulses and grains?', answer: 'We partner directly with certified organic farms and conduct regular soil and product testing to ensure everything meets strict organic and safety standards.' },
    { question: 'How long does shipping take for fresh products?', answer: 'For fresh produce, we offer next-day delivery in major city zones to ensure maximum freshness upon arrival. Pantry items are delivered within 2-3 business days.' }
  ];

  const heroImages = [
    '/images/banner image.jpg',
    '/images/banner2.jpg',
    '/images/banner3.jpg',
    '/images/banner4.jpg',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products?limit=250', { cache: 'no-store' }),
          fetch('/api/categories?limit=50', { cache: 'no-store' }),
        ]);

        const productsJson = await productsRes.json();
        const categoriesJson = await categoriesRes.json();

        const productsArray = Array.isArray(productsJson) ? productsJson : productsJson.data || [];
        const categoriesArray = Array.isArray(categoriesJson) ? categoriesJson : categoriesJson.data || [];

        setProducts(productsArray);
        setCategories(categoriesArray);
      } catch (err) {
        console.error('Failed to fetch home page data:', err);
        setProducts(dummyProducts);
        setCategories(dummyCategories);
      }
    };
    fetchData();
  }, []);

  const orderedCategories = CATEGORY_ORDER.map((name) => {
    const found = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found) return found;
    return {
      _id: name,
      name,
      slug: name.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-'),
      image: categoryImageMap[name] || null,
      description: `Explore fresh ${name} direct from farm.`
    };
  });

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative flex h-[400px] items-center overflow-hidden bg-background-secondary text-accent-darker sm:h-[480px] lg:h-[550px] w-full">
        {heroImages.map((src, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <Image
              src={src}
              alt={`Premium organic products ${idx + 1}`}
              fill
              priority={idx === 0}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-accent-darker/80 via-accent-darker/40 to-transparent"></div>
          </div>
        ))}

        <div className="mx-auto max-w-[90rem] w-full px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-xl">
            <span className="mb-4 inline-block tracking-widest uppercase text-xs font-bold text-white/90 border-b-2 border-primary-variant pb-1">
              100% Organic Farm Products
            </span>
            <h1 className="mb-6 text-4xl font-serif leading-tight text-white sm:text-5xl lg:text-6xl">
              Fresh Harvest for a <br />
              <span className="text-[#a4d4b4]">Healthier Life</span>
            </h1>
            <p className="mb-8 max-w-lg text-sm text-gray-100 sm:text-base leading-relaxed">
              From naturally grown vegetables to farm-fresh fruits, bring home wholesome nutrition, authentic taste, and the goodness of chemical-free farming.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="rounded-full bg-primary-variant px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-primary-hover shadow-md"
              >
                Shop Now
              </Link>
              <Link href="/subscriptions" className="rounded-full border border-white/40 bg-white/10 backdrop-blur-sm px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/20">
                Subscribe Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Home Page Sections Centered Container */}
      <div className="max-w-[90rem] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {/* Our Strengths Section */}
        <section className="space-y-10 pt-4 pb-8">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-serif text-accent-darker sm:text-4xl font-bold">
              Our Strengths
            </h2>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Discover what makes us different and why we're the best choice for your organic needs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {[
              { icon: <Leaf className="w-7 h-7 text-primary" />, title: 'Ethically Sourced', desc: 'Straight from sustainable local farms to your doorstep.' },
              { icon: <Droplets className="w-7 h-7 text-primary" />, title: 'Pure Integrity', desc: 'Transparent processes you can trust, every single time.' },
              { icon: <UserCheck className="w-7 h-7 text-primary" />, title: 'Community First', desc: 'Empowering rural growers and supporting local economy.' },
              { icon: <Leaf className="w-7 h-7 text-primary" />, title: 'Curated Organic', desc: 'A handpicked selection of premium organic goods.' },
              { icon: <ShieldCheck className="w-7 h-7 text-primary" />, title: 'Gold Standard', desc: 'Triple-certified quality checks for max nutrient density.' },
              { icon: <Leaf className="w-7 h-7 text-primary" />, title: 'Ancient Harvest', desc: 'Preserving heritage grains with modern safety standards.' },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 bg-white border border-gray-100 rounded-3xl transition-all hover:border-primary/30 hover:shadow-sm">
                <div className="mb-5 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-[15px] font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-500 text-[13px] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Organic Categories Section */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-serif text-accent-darker sm:text-4xl font-bold">
              Shop by Category
            </h2>
            <div className="w-16 h-0.5 bg-primary-variant mx-auto"></div>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Explore our curated selection of premium organic and naturally grown products.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 pt-4">
            {orderedCategories.map((cat) => (
              <Link
                key={cat._id || cat.slug}
                href={`/products?category=${encodeURIComponent(cat.slug || cat.name)}`}
                className="group flex flex-col items-center gap-2.5 text-center focus:outline-none"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 overflow-hidden rounded-full border border-gray-100 bg-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-primary group-hover:shadow-md">
                  <img
                    src={cat.image || categoryImageMap[cat.name] || 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&q=80'}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700 transition-colors duration-200 group-hover:text-primary">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="pt-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link
              href="/products"
              className="group inline-flex items-center justify-center gap-4 rounded-none border-2 border-primary bg-white px-10 py-5 text-base font-semibold uppercase tracking-[0.24em] text-primary transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              <span>SEE ALL PRODUCTS</span>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition duration-300 ease-out group-hover:bg-primary-hover">
                <ArrowRight className="h-6 w-6" />
              </span>
            </Link>
          </div>
        </section>

        <section className="space-y-10 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-serif text-accent-darker sm:text-4xl font-bold">
              Our Fresh Harvest
            </h2>
            <div className="w-16 h-0.5 bg-primary-variant mx-auto"></div>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Explore fresh organic products by category
            </p>
          </div>

          <div className="space-y-12">
            {CATEGORY_ORDER.map((categoryName) => {
              const categoryProducts = products
                .filter(
                  (product) =>
                    product.category?.toLowerCase() === categoryName.toLowerCase() ||
                    product.subcategory?.toLowerCase() === categoryName.toLowerCase()
                )
                .slice(0, 5);

              return (
                <div key={categoryName} className="space-y-4 border-b border-gray-100 pb-8 last:border-0">
                  <div className="flex justify-between items-end px-2">
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1e3b2b]">
                      {categoryName}
                    </h3>
                    <Link
                      href={`/products?category=${encodeURIComponent(categoryName)}`}
                      className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                    >
                      View All <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {categoryProducts.length > 0 ? (
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 md:gap-5">
                      {categoryProducts.map((product) => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm font-medium text-gray-500 shadow-sm">
                      no item we have
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Subscription Plans Section */}
        <section className="space-y-8 pt-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <span className="text-xs font-bold text-primary-variant uppercase tracking-widest block">
              Save More
            </span>
            <h2 className="text-3xl font-serif text-accent-darker sm:text-4xl">
              Subscription Plans
            </h2>
            <div className="w-16 h-0.5 bg-primary-variant mx-auto"></div>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Get fresh harvest delivered regularly at discounted prices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-background-secondary rounded-[2.5rem] border border-gray-200 shadow-sm p-8 sm:p-10 hover:shadow-lg transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <CalendarRange className="w-32 h-32 text-primary-variant" />
              </div>
              <div className="relative z-10">
                <span className="inline-block px-4 py-1.5 bg-white border border-gray-200 text-primary-variant text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                  Weekly Plan
                </span>
                <h3 className="text-4xl font-serif text-accent-darker mb-2">10% OFF</h3>
                <p className="text-gray-500 text-sm mb-6">Perfect for families needing fresh supplies every week.</p>
                <ul className="space-y-3 mb-8">
                  {['Deliveries every 7 days', 'Pause or cancel anytime', 'Free delivery on all orders', 'Priority support'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-primary-variant shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/subscriptions" className="block w-full py-3.5 text-center rounded-full bg-white border border-gray-200 text-accent-darker font-bold hover:bg-primary-variant hover:text-white transition-all shadow-sm">
                  View Subscriptions
                </Link>
              </div>
            </div>

            <div className="bg-accent-darker rounded-[2.5rem] shadow-xl p-8 sm:p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <CalendarRange className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10">
                <span className="inline-block px-4 py-1.5 bg-accent-warm text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4 shadow-sm">
                  Monthly Plan
                </span>
                <h3 className="text-4xl font-serif text-white mb-2">15% OFF</h3>
                <p className="text-[#a4d4b4] text-sm mb-6 font-light">Best value for long-term supply of essentials.</p>
                <ul className="space-y-3 mb-8 text-white/90">
                  {['Deliveries every 30 days', 'Maximum savings guaranteed', 'Pause or cancel anytime', 'Early access to seasonal harvest'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-accent-warm shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/subscriptions" className="block w-full py-3.5 text-center rounded-full bg-accent-warm text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-accent-warm/20">
                  Subscribe Now
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Farm Story Section */}
        <section className="pt-16 pb-8">
          <div className="bg-accent-darker rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row shadow-xl">
            <div className="w-full lg:w-1/2 p-10 sm:p-16 flex flex-col justify-center text-white">
              <span className="text-xs font-bold text-[#a4d4b4] uppercase tracking-widest block mb-4 border-b border-[#a4d4b4]/30 pb-2 w-max">
                Our Roots
              </span>
              <h2 className="text-3xl font-serif sm:text-4xl mb-6 leading-tight">
                From Soil to Soul: <br />Our commitment to direct farming
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 font-light">
                A deep dive into our ethical sourcing process and how we support our local farming community by cutting out the middlemen. We partner directly with local, sustainable farms to bring the harvest straight to your door.
              </p>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-8 font-light">
                By choosing us, you are preserving heritage farming with modern safety standards and feeding your family the best nature has to offer.
              </p>
              <Link href="/about" className="self-start inline-flex items-center justify-center gap-2 bg-primary-variant text-white px-8 py-3.5 rounded-full font-bold hover:bg-primary-hover transition-all">
                Join Our Community <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="w-full lg:w-1/2 relative min-h-[300px] lg:min-h-full">
              <img
                src="https://images.unsplash.com/photo-1595858641158-b6481cb1ebde?q=80&w=800&auto=format&fit=crop"
                alt="Farmer harvesting vegetables"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
            </div>
          </div>
        </section>

        {/* Customer Testimonials Section */}
        <section className="space-y-8 pt-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <h2 className="text-3xl font-serif text-accent-darker sm:text-4xl">
              What Our Customers Say
            </h2>
            <div className="w-16 h-0.5 bg-primary-variant mx-auto"></div>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Join thousands of happy families enjoying fresh produce daily.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { name: 'Priya Sharma', role: 'Regular Customer', content: 'The aroma takes me back to my village. Truly authentic and pure. Delivery is super fast!', rating: 5, bg: 'bg-background-secondary border-gray-200' },
              { name: 'Rahul Verma', role: 'Subscriber', content: 'You can taste the difference compared to supermarket brands. Subscribing was the best decision.', rating: 5, bg: 'bg-white border-gray-200' },
              { name: 'Anita Desai', role: 'Home Chef', content: 'The texture and quality is perfect. My family has switched to this for all our meals.', rating: 5, bg: 'bg-background-secondary border-gray-200' },
            ].map((testimonial, i) => (
              <div key={i} className={`p-8 rounded-[2rem] border shadow-sm relative ${testimonial.bg} hover:-translate-y-1 transition-transform`}>
                <Quote className="w-8 h-8 text-primary-variant/20 absolute top-8 right-8" />
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent-warm text-accent-warm" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-8 relative z-10 leading-relaxed text-sm">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-variant flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-accent-darker text-sm">{testimonial.name}</h4>
                    <span className="text-xs text-gray-500 font-medium">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Delivery Information Section */}
        <section className="space-y-8 pt-8 border-t border-gray-200">
          <div className="bg-background-secondary border border-gray-200 rounded-[3rem] p-10 sm:p-14 text-accent-darker relative overflow-hidden shadow-sm">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="flex flex-col items-center md:items-start pt-6 md:pt-0">
                <Clock className="w-8 h-8 text-primary-variant mb-4" />
                <h3 className="text-lg font-bold mb-2 font-serif">Delivery Timing</h3>
                <p className="text-gray-500 text-sm">7:00 AM - 10:00 PM<br />7 Days a week</p>
              </div>
              <div className="flex flex-col items-center md:items-start md:pl-8 pt-6 md:pt-0">
                <MapPin className="w-8 h-8 text-accent-warm mb-4" />
                <h3 className="text-lg font-bold mb-2 font-serif">Delivery Areas</h3>
                <p className="text-gray-500 text-sm">Currently delivering across all major city pin codes.</p>
              </div>
              <div className="flex flex-col items-center md:items-start md:pl-8 pt-6 md:pt-0">
                <ShieldCheck className="w-8 h-8 text-primary-variant mb-4" />
                <h3 className="text-lg font-bold mb-2 font-serif">Freshness Guarantee</h3>
                <p className="text-gray-500 text-sm">100% replacement if produce is not fresh upon arrival.</p>
              </div>
              <div className="flex flex-col items-center md:items-start md:pl-8 pt-6 md:pt-0">
                <Truck className="w-8 h-8 text-accent-warm mb-4" />
                <h3 className="text-lg font-bold mb-2 font-serif">Fast Dispatch</h3>
                <p className="text-gray-500 text-sm">Orders are processed within 2 hours of placement.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="space-y-8 pt-8 border-t border-gray-200">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <span className="text-xs font-bold text-primary-variant uppercase tracking-widest block">
              Our News & Articles
            </span>
            <h2 className="text-3xl font-serif text-accent-darker sm:text-4xl">
              Latest From Our Blog
            </h2>
            <div className="w-16 h-0.5 bg-primary-variant mx-auto"></div>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Stay updated with fresh nutrition guides, agricultural stories from our local farms, and wholesome health tips.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-8 pt-12 pb-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-10">
            <h2 className="text-3xl font-serif text-accent-darker sm:text-4xl font-bold">
              Common Inquiries
            </h2>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Find answers to the most common questions about our products and services.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-100 rounded-md transition-colors hover:bg-gray-50"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center focus:outline-none"
                >
                  <span className="text-gray-700 font-medium text-[15px] sm:text-base">{faq.question}</span>
                  <span className="text-gray-400 font-light text-xl ml-4">
                    {activeFaq === index ? '-' : '+'}
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="px-6 pb-5 text-gray-500 text-sm sm:text-[15px] leading-relaxed border-t border-gray-200/60 pt-4 mt-1 mx-2">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
