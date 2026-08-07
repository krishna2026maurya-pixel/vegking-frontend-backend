'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Search } from 'lucide-react';

function ProductsContent() {
    const searchParams = useSearchParams();

    // Read will category from URL, default to 'All'
    const selectedCategory = searchParams.get('category') || 'All';
    const categoryId = searchParams.get('category_id');
    const searchQuery = searchParams.get('q')?.trim() || '';
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError('');
                let productUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/products?page=1&limit=1000`;
                if (searchQuery) {
                    productUrl += `&search=${encodeURIComponent(searchQuery)}`;
                }

                let explorePromise: Promise<any> = Promise.resolve(null);
                if (categoryId) {
                    explorePromise = fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/hierarchy/explore?category_id=${categoryId}`, {
                        method: 'GET',
                        cache: 'no-store',
                        headers: { Accept: 'application/json' },
                    }).then(res => res.json());
                }

                const [productsRes, categoriesRes, exploreRes] = await Promise.all([
                    fetch(productUrl, {
                        method: 'GET',
                        cache: 'no-store',
                        headers: { Accept: 'application/json' },
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/categories?page=1&limit=20`, {
                        method: 'GET',
                        cache: 'no-store',
                        headers: { Accept: 'application/json' },
                    }),
                    explorePromise
                ]) as [Response, Response, any];

                const ct = productsRes.headers.get('content-type') || '';
                if (!ct.includes('application/json')) {
                    throw new Error('Products API did not return JSON');
                }
                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();

                // Extract array from standard response formats
                const productsArray = Array.isArray(productsData)
                    ? productsData
                    : Array.isArray(productsData.data)
                    ? productsData.data
                    : [];

                const categoriesArray = Array.isArray(categoriesData)
                    ? categoriesData
                    : Array.isArray(categoriesData.data)
                    ? categoriesData.data
                    : [];

                if (exploreRes?.success && exploreRes?.data?.subcategories) {
                    setSubcategories(exploreRes.data.subcategories);
                } else {
                    setSubcategories([]);
                }

                const mappedProducts = productsArray.map((p: any) => ({
                    ...p,
                    name: p.name || p.product_name,
                    price: p.price || p.selling_price,
                    image: p.image || p.product_image,
                    discount: p.discount || p.discount_percent || (p.mrp && p.selling_price ? ((p.mrp - p.selling_price) / p.mrp * 100).toFixed(1) : 0),
                    stock: p.stock || p.stock_status || (p.in_stock ? 100 : 0)
                }));

                setProducts(mappedProducts);
                setCategories(categoriesArray.filter((c: any) => c.isActive !== false));
            } catch (err) {
                console.error('Failed to fetch products:', err);
                setError('Products are not available right now. Please try again shortly.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const refresh = setInterval(fetchData, 10000);
        window.addEventListener('focus', fetchData);

        return () => {
            clearInterval(refresh);
            window.removeEventListener('focus', fetchData);
        };
    }, [searchQuery, categoryId]);

    const selectedCategoryData = categories.find((category) =>
        category.slug?.toLowerCase() === selectedCategory.toLowerCase() ||
        category.name?.toLowerCase() === selectedCategory.toLowerCase()
    );

    const hasCategoryFilter = selectedCategory !== 'All';
    const normalizedSearch = searchQuery.toLowerCase();

    const selectedCategoryLabel =
        !hasCategoryFilter
            ? 'All Products'
            : selectedCategoryData?.name || selectedCategory;

    const filtered = products.filter((product) => {
        const matchesCategory = !hasCategoryFilter || (
            product.categorySlug?.toLowerCase() === selectedCategory.toLowerCase() ||
            product.category?.toLowerCase() === selectedCategory.toLowerCase() ||
            product.subcategory?.toLowerCase() === selectedCategory.toLowerCase() ||
            product.subcategorySlug?.toLowerCase() === selectedCategory.toLowerCase() ||
            (selectedCategoryData && (
                product.category?.toLowerCase() === selectedCategoryData.name.toLowerCase() ||
                product.subcategory?.toLowerCase() === selectedCategoryData.name.toLowerCase()
            )) ||
            product.category === categoryId
        );

        const matchesSearch = !normalizedSearch || [
            product.name,
            product.category,
            product.categorySlug,
            product.description,
        ].some((value) => value?.toLowerCase().includes(normalizedSearch));

        const matchesSubcategory = !selectedSubcategoryId || product.subcategory === selectedSubcategoryId || product.sub_category === selectedSubcategoryId;

        return matchesCategory && matchesSearch && matchesSubcategory;
    });

    const pageTitle = searchQuery
        ? `Search results for "${searchQuery}"`
        : selectedCategoryLabel;

    return (
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col gap-8">
                <div className="mb-2 border-b border-gray-100 pb-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-serif text-[#1e3b2b] font-bold">
                                {pageTitle}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1 font-medium">
                                {filtered.length} {filtered.length === 1 ? 'item' : 'items'} found
                            </p>
                        </div>
                        {(hasCategoryFilter || searchQuery) && (
                            <p className="max-w-md text-sm font-medium text-gray-500">
                                {hasCategoryFilter
                                    ? `Showing products from the ${selectedCategoryLabel} category${searchQuery ? ` matching "${searchQuery}"` : ''}.`
                                    : 'Showing matching products from all categories.'}
                            </p>
                        )}
                    </div>
                </div>

                {subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-2">
                        <button 
                            onClick={() => setSelectedSubcategoryId(null)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${!selectedSubcategoryId ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            All Products
                        </button>
                        {subcategories.map(sub => (
                            <button
                                key={sub._id}
                                onClick={() => setSelectedSubcategoryId(sub._id)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${selectedSubcategoryId === sub._id ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {sub.category_name}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 md:gap-5">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-[310px] w-full max-w-[220px] animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-12 text-center text-red-700">
                        {error}
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 md:gap-5">
                        {filtered.length > 0 ? (
                            filtered.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))
                        ) : (
                            <div className="col-span-full rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                                    <Search className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">No products found</h3>
                                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                                    {searchQuery
                                        ? `No products match "${searchQuery}". Try another product name or category.`
                                        : `We currently do not have any products in the ${selectedCategoryLabel} category. Try selecting another category from the Products menu.`}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Wrap in Suspense boundary because useSearchParams() triggers client-side de-opting
export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="max-w-[90rem] mx-auto px-4 py-20 flex justify-center">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ProductsContent />
        </Suspense>
    );
}
