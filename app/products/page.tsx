'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Search, Sparkles, Filter, X, ChevronRight } from 'lucide-react';

const CATEGORY_EMOJIS: Record<string, string> = {
    'all': '✨',
    'vegetables': '🥦',
    'leafy-greens': '🥬',
    'root-vegetables': '🥕',
    'fruits': '🍎',
    'dairy-eggs': '🥛',
    'dairy-&-eggs': '🥛',
    'herbs-spices': '🧄',
    'herbs-&-spices': '🧄',
    'organic-daals': '🌾',
    'exotic-vegetables': '🥑',
    'seeds': '🌱',
};

const cleanStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const cleanStrWithAnd = (s: string) => (s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

function isCategoryMatch(prodCat: string, targetCat: string) {
    if (!prodCat || !targetCat) return false;
    const p1 = cleanStr(prodCat);
    const t1 = cleanStr(targetCat);
    if (p1 === t1) return true;
    const p2 = cleanStrWithAnd(prodCat);
    const t2 = cleanStrWithAnd(targetCat);
    if (p2 === t2) return true;
    if (p1.length > 3 && t1.length > 3 && (p1.includes(t1) || t1.includes(p1))) return true;
    return false;
}

function ProductsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const rawCategory = searchParams.get('category') || 'All';
    const categoryId = searchParams.get('category_id');
    const searchQuery = searchParams.get('q')?.trim() || '';

    const isAllSelected = useMemo(() => {
        if (!rawCategory) return true;
        const lower = rawCategory.toLowerCase().trim();
        return lower === 'all' || lower === 'all products' || lower === 'all-products';
    }, [rawCategory]);

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
                // Fetch products from main catalog API
                let productUrl = `/api/products?limit=1000`;
                if (searchQuery) {
                    productUrl += `&search=${encodeURIComponent(searchQuery)}`;
                }

                let explorePromise: Promise<any> = Promise.resolve(null);
                if (categoryId) {
                    explorePromise = fetch(`/api/v1/hierarchy/explore?category_id=${categoryId}`, {
                        method: 'GET',
                        cache: 'no-store',
                        headers: { Accept: 'application/json' },
                    }).then(res => res.json()).catch(() => null);
                }

                const [productsRes, categoriesRes, exploreRes] = await Promise.all([
                    fetch(productUrl, {
                        method: 'GET',
                        cache: 'no-store',
                        headers: { Accept: 'application/json' },
                    }),
                    fetch(`/api/categories?limit=50`, {
                        method: 'GET',
                        cache: 'no-store',
                        headers: { Accept: 'application/json' },
                    }),
                    explorePromise
                ]) as [Response, Response, any];

                let productsData: any = {};
                if (productsRes.ok) {
                    productsData = await productsRes.json();
                } else {
                    // Fallback to /api/v1/products if needed
                    const fbRes = await fetch(`/api/v1/products?page=1&limit=1000`, {
                        method: 'GET',
                        cache: 'no-store',
                        headers: { Accept: 'application/json' },
                    });
                    if (fbRes.ok) productsData = await fbRes.json();
                }

                let categoriesData: any = {};
                if (categoriesRes.ok) {
                    categoriesData = await categoriesRes.json();
                }

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
                    _id: p._id,
                    name: p.name || p.product_name,
                    product_name: p.product_name || p.name,
                    price: p.price ?? p.selling_price ?? 0,
                    selling_price: p.selling_price ?? p.price ?? 0,
                    mrp: p.mrp ?? p.price ?? p.selling_price ?? 0,
                    image: p.image || p.product_image || (Array.isArray(p.images) && p.images[0]) || '/placeholder.png',
                    product_image: p.product_image || p.image || (Array.isArray(p.images) && p.images[0]) || '/placeholder.png',
                    category: p.category || '',
                    categorySlug: p.categorySlug || (p.category || '').toLowerCase().replace(/\s+/g, '-'),
                    subcategory: p.subcategory || '',
                    subcategorySlug: p.subcategorySlug || (p.subcategory || '').toLowerCase().replace(/\s+/g, '-'),
                    discount: p.discount || p.discount_percent || (p.mrp && p.selling_price ? Math.round(((p.mrp - p.selling_price) / p.mrp) * 100) : 0),
                    stock: (p.stock !== undefined && p.stock !== null && !isNaN(Number(p.stock)))
                        ? Number(p.stock)
                        : (p.stock_status !== undefined && p.stock_status !== null && !isNaN(Number(p.stock_status))
                            ? Number(p.stock_status)
                            : (p.in_stock ? 100 : 0)),
                    stock_status: p.stock_status !== undefined ? p.stock_status : (Number(p.stock) > 0 ? 1 : 0),
                    inStock: p.inStock !== undefined ? p.inStock : (Number(p.stock) > 0 || Number(p.stock_status) === 1),
                }));

                setProducts(mappedProducts);
                setCategories(categoriesArray.filter((c: any) => c.isActive !== false && c.is_active !== '0'));
            } catch (err) {
                console.error('Failed to fetch products:', err);
                setError('Products are not available right now. Please try again shortly.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const refresh = setInterval(fetchData, 15000);
        window.addEventListener('focus', fetchData);

        return () => {
            clearInterval(refresh);
            window.removeEventListener('focus', fetchData);
        };
    }, [searchQuery, categoryId]);

    // Active category resolution
    const selectedCategoryData = useMemo(() => {
        if (isAllSelected) return null;
        return categories.find((c) =>
            isCategoryMatch(c.slug, rawCategory) ||
            isCategoryMatch(c.name, rawCategory)
        );
    }, [categories, rawCategory, isAllSelected]);

    const selectedCategoryLabel = useMemo(() => {
        if (isAllSelected) return 'All Products';
        return selectedCategoryData?.name || rawCategory;
    }, [isAllSelected, selectedCategoryData, rawCategory]);

    // Available categories list with "All Products" at the front
    const allCategoryTabs = useMemo(() => {
        const list = [{ _id: 'all', name: 'All Products', slug: 'all' }];
        const seen = new Set<string>(['all']);

        for (const cat of categories) {
            const slugKey = cleanStr(cat.slug || cat.name);
            if (!seen.has(slugKey)) {
                seen.add(slugKey);
                list.push({
                    _id: cat._id || slugKey,
                    name: cat.name,
                    slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
                });
            }
        }
        return list;
    }, [categories]);

    // Accurate category counts calculation matching the actual products from DB
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: products.length };

        for (const cat of allCategoryTabs) {
            if (cat.slug === 'all') {
                counts['all'] = products.length;
            } else {
                const matchingCount = products.filter((p) =>
                    isCategoryMatch(p.category, cat.name) ||
                    isCategoryMatch(p.category, cat.slug) ||
                    isCategoryMatch(p.categorySlug, cat.name) ||
                    isCategoryMatch(p.categorySlug, cat.slug) ||
                    isCategoryMatch(p.subcategory, cat.name) ||
                    isCategoryMatch(p.subcategory, cat.slug)
                ).length;

                counts[cat.slug] = matchingCount;
                counts[cleanStr(cat.name)] = matchingCount;
                counts[cleanStr(cat.slug)] = matchingCount;
            }
        }
        return counts;
    }, [products, allCategoryTabs]);

    // Filter products
    const filtered = useMemo(() => {
        const normalizedSearch = searchQuery.toLowerCase();
        return products.filter((product) => {
            const matchesCategory = isAllSelected || (
                isCategoryMatch(product.category, rawCategory) ||
                isCategoryMatch(product.categorySlug, rawCategory) ||
                isCategoryMatch(product.subcategory, rawCategory) ||
                isCategoryMatch(product.subcategorySlug, rawCategory) ||
                (selectedCategoryData && (
                    isCategoryMatch(product.category, selectedCategoryData.name) ||
                    isCategoryMatch(product.category, selectedCategoryData.slug)
                )) ||
                (categoryId && product.category === categoryId)
            );

            const matchesSearch = !normalizedSearch || [
                product.name,
                product.category,
                product.categorySlug,
                product.description,
            ].some((value) => value?.toLowerCase().includes(normalizedSearch));

            const matchesSubcategory = !selectedSubcategoryId ||
                product.subcategory === selectedSubcategoryId ||
                product.sub_category === selectedSubcategoryId ||
                isCategoryMatch(product.subcategory, selectedSubcategoryId);

            return matchesCategory && matchesSearch && matchesSubcategory;
        });
    }, [products, isAllSelected, rawCategory, selectedCategoryData, categoryId, searchQuery, selectedSubcategoryId]);

    const handleSelectCategory = (catSlug: string) => {
        setSelectedSubcategoryId(null);
        if (catSlug === 'all') {
            router.push('/products', { scroll: false });
        } else {
            router.push(`/products?category=${encodeURIComponent(catSlug)}`, { scroll: false });
        }
    };

    const pageTitle = searchQuery
        ? `Search results for "${searchQuery}"`
        : selectedCategoryLabel;

    return (
        <div className="max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col gap-6">

                {/* Top Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <Link href="/" className="hover:text-emerald-700 transition">Home</Link>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    <Link href="/products" className={`hover:text-emerald-700 transition ${isAllSelected ? 'text-emerald-700 font-bold' : ''}`}>
                        Products
                    </Link>
                    {!isAllSelected && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                {selectedCategoryLabel}
                            </span>
                        </>
                    )}
                </nav>

                {/* Header Title & Items Count */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-gray-100 pb-5">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-serif text-[#1e3b2b] font-bold tracking-tight">
                                {pageTitle}
                            </h1>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {filtered.length} {filtered.length === 1 ? 'item' : 'items'} available
                            </span>
                            {!isAllSelected && (
                                <button
                                    onClick={() => handleSelectCategory('all')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 border border-gray-200 transition cursor-pointer"
                                    title="Show all products from all categories"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Show All Products
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium">
                            {isAllSelected
                                ? 'Browsing fresh vegetables, fruits, herbs, and groceries sourced directly from verified local farms.'
                                : `Showing items curated under the "${selectedCategoryLabel}" category.`}
                        </p>
                    </div>
                </div>

                {/* Compact Category Selector Bar (Zero horizontal scroll, compact flex-wrap) */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 sm:p-2.5 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Filter className="w-3 h-3 text-emerald-600" /> Categories
                        </span>
                        {!isAllSelected && (
                            <button
                                onClick={() => handleSelectCategory('all')}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                            >
                                Reset to All Products
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {allCategoryTabs.map((cat) => {
                            const isTabActive = cat.slug === 'all'
                                ? isAllSelected
                                : (!isAllSelected && (
                                    isCategoryMatch(cat.slug, rawCategory) ||
                                    isCategoryMatch(cat.name, rawCategory)
                                ));

                            const emoji = CATEGORY_EMOJIS[cleanStr(cat.slug)] || CATEGORY_EMOJIS[cleanStr(cat.name)] || '🥗';
                            const count = cat.slug === 'all'
                                ? products.length
                                : (categoryCounts[cat.slug] ?? categoryCounts[cleanStr(cat.name)] ?? categoryCounts[cleanStr(cat.slug)] ?? 0);

                            return (
                                <button
                                    key={cat._id}
                                    onClick={() => handleSelectCategory(cat.slug)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 cursor-pointer ${isTabActive
                                        ? 'bg-[#1e3b2b] text-white shadow-xs font-bold ring-1 ring-[#1e3b2b]'
                                        : 'bg-gray-50/90 text-gray-700 hover:text-[#1e3b2b] hover:bg-emerald-50/60 border border-gray-200/70 hover:border-emerald-300'
                                        }`}
                                >
                                    <span className="text-xs sm:text-sm">{emoji}</span>
                                    <span>{cat.name}</span>
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold leading-tight ${isTabActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white text-gray-500 border border-gray-200/60'
                                            }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Subcategories (if available for selected category) */}
                {subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 pb-1">
                        <button
                            onClick={() => setSelectedSubcategoryId(null)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!selectedSubcategoryId
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All in {selectedCategoryLabel}
                        </button>
                        {subcategories.map(sub => (
                            <button
                                key={sub._id}
                                onClick={() => setSelectedSubcategoryId(sub._id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedSubcategoryId === sub._id
                                    ? 'bg-emerald-700 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {sub.category_name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Products Grid / Loading / Empty States */}
                {loading ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4.5">
                        {Array.from({ length: 12 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="w-full h-[260px] sm:h-[370px] bg-white border border-gray-100 rounded-2xl p-2.5 sm:px-4 sm:py-3.5 animate-pulse flex flex-col justify-between shadow-2xs"
                            >
                                <div>
                                    <div className="w-full aspect-square sm:h-44 bg-gray-100 rounded-xl mb-2 sm:mb-3"></div>
                                    <div className="w-16 h-3 bg-gray-100 rounded mb-2"></div>
                                    <div className="w-full h-4 bg-gray-100 rounded mb-1"></div>
                                </div>
                                <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                                    <div className="w-12 h-4 bg-gray-100 rounded"></div>
                                    <div className="w-20 h-7 bg-gray-100 rounded-xl"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-12 text-center text-red-700 shadow-xs">
                        <p className="font-bold">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition"
                        >
                            Retry Loading
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4.5">
                        {filtered.length > 0 ? (
                            filtered.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))
                        ) : (
                            <div className="col-span-full rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-xs">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <Search className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">No products found</h3>
                                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                                    {searchQuery
                                        ? `No products match "${searchQuery}". Try searching for another vegetable or item.`
                                        : `No products currently available under ${selectedCategoryLabel}. Try selecting another category.`}
                                </p>
                                <button
                                    onClick={() => handleSelectCategory('all')}
                                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3b2b] text-white text-xs font-bold hover:bg-[#152a1e] transition shadow-xs cursor-pointer"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    View All {products.length} Products
                                </button>
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
            <div className="max-w-[92rem] mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-gray-400">Loading VegKing Fresh Catalog...</span>
            </div>
        }>
            <ProductsContent />
        </Suspense>
    );
}
