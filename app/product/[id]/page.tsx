'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { ArrowLeft, Check, PackageSearch, ShieldCheck, Truck } from 'lucide-react';

export default function ProductDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const { addToCart } = useCart();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchProduct = async () => {
            try {
                setLoading(true);
                // As per user request, we use the v1 products API 
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.error || 'Failed to fetch product details.');
                }

                setProduct(data.data);
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        if (!product) return;
        // Mapping v1 API fields to what CartContext might expect
        addToCart({
            _id: product._id,
            name: product.product_name,
            price: product.selling_price,
            image: product.product_image,
            qty: quantity // quantity to add
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-[70vh] flex flex-col justify-center items-center px-4 text-center">
                <PackageSearch className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
                <p className="text-gray-500 max-w-md">{error || 'This product might have been removed or is currently unavailable.'}</p>
                <Link href="/products" className="mt-6 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">
                    Browse All Products
                </Link>
            </div>
        );
    }

    // Prepare similar products for the ProductCard component which expects a specific mapping
    const mappedSimilarProducts = (product.similar_products || []).map((sp: any) => ({
        _id: sp._id,
        name: sp.product_name,
        price: sp.selling_price,
        discount: sp.mrp && sp.selling_price ? ((sp.mrp - sp.selling_price) / sp.mrp * 100).toFixed(1) : 0,
        image: sp.product_image,
        stock: sp.stock_status,
        weightOptions: [] // Assuming standard vegetables
    }));

    return (
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-600 transition mb-8 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Products
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                {/* Image Section */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="aspect-square bg-gray-50 rounded-3xl border border-gray-100 p-8 flex items-center justify-center relative overflow-hidden group">
                        {product.discount_percent > 0 && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg z-10 shadow-sm">
                                {product.discount_percent}% OFF
                            </div>
                        )}
                        <img
                            src={product.product_image || '/images/product-card-default.jpg'}
                            alt={product.product_name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                            onError={(e) => { e.currentTarget.src = '/images/product-card-default.jpg'; }}
                        />
                    </div>
                </div>

                {/* Details Section */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="mb-2">
                        {product.brand && (
                            <span className="text-sm font-bold tracking-widest text-green-600 uppercase mb-2 block">{product.brand}</span>
                        )}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                            {product.product_name}
                        </h1>

                        <div className="flex items-center gap-3 mb-6">
                            {product.in_stock ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    In Stock
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-semibold border border-red-200">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    Out of Stock
                                </span>
                            )}
                            {product.category && (
                                <span className="text-gray-400 text-sm">| &nbsp; {product.category}</span>
                            )}
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 bg-gray-50/50 rounded-3xl border border-gray-100 mb-8">
                        <div className="flex flex-wrap items-baseline gap-4 mb-2">
                            <span className="text-4xl font-black text-gray-900">₹{product.selling_price}</span>
                            {product.mrp && product.mrp > product.selling_price && (
                                <>
                                    <span className="text-lg text-gray-400 font-medium line-through decoration-gray-300">₹{product.mrp}</span>
                                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">Save ₹{product.saving_amount}</span>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Inclusive of all taxes</p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white h-14">
                                <button
                                    className="px-5 text-gray-500 hover:text-green-600 text-xl font-medium transition"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    -
                                </button>
                                <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                                <button
                                    className="px-5 text-gray-500 hover:text-green-600 text-xl font-medium transition"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={!product.in_stock}
                                className={`flex-1 h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${!product.in_stock
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : added
                                            ? 'bg-green-700 text-white scale-[0.98]'
                                            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/30 hover:-translate-y-0.5'
                                    }`}
                            >
                                {added ? (
                                    <><Check className="w-5 h-5" /> Added to Cart</>
                                ) : (
                                    <>{product.in_stock ? 'Add to Cart' : 'Out of Stock'}</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Features list */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Truck className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Fast Delivery</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Quality Assured</span>
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="mt-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">About this product</h3>
                            <div
                                className="prose prose-green max-w-none text-gray-600 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Similar Products */}
            {mappedSimilarProducts.length > 0 && (
                <div className="mt-24">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Similar Products</h2>
                        <Link href="/products" className="text-green-600 font-semibold hover:text-green-700">View All</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                        {mappedSimilarProducts.map((sp: any) => (
                            <ProductCard key={sp._id} product={sp} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
