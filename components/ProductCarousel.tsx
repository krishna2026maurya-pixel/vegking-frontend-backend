'use client';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

interface ProductCarouselProps {
  title: string;
  seeAllHref: string;
  products: any[];
  loading?: boolean;
}

export default function ProductCarousel({
  title,
  seeAllHref,
  products,
  loading = false,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const firstChild = container.firstElementChild as HTMLElement;
    if (!firstChild) return;

    const cardWidth = firstChild.offsetWidth;
    const gap = window.innerWidth >= 640 ? 18 : 6; // sm:gap-4.5 (18px), mobile gap-1.5 (6px)
    const itemFullWidth = cardWidth + gap;

    // Scroll by the number of visible cards (full page step)
    const visibleCards = Math.max(1, Math.floor((container.clientWidth + gap) / itemFullWidth));
    const scrollDistance = visibleCards * itemFullWidth;

    container.scrollBy({
      left: direction === 'left' ? -scrollDistance : scrollDistance,
      behavior: 'smooth',
    });
  };

  if (!loading && products.length === 0) {
    return null;
  }

  // Responsive full-width card classes:
  // Mobile (untouched): 3 cards per view (w-[calc((100%-12px)/3)])
  // Tablet (sm): 3 cards per view
  // MD: 4 cards per view
  // LG: 5 cards per view
  // XL: 6 cards per view
  const cardResponsiveClass =
    'w-[calc((100%-12px)/3)] sm:w-[calc((100%-36px)/3)] md:w-[calc((100%-54px)/4)] lg:w-[calc((100%-72px)/5)] xl:w-[calc((100%-90px)/6)] shrink-0 snap-start flex';

  return (
    <div className="space-y-3.5 relative sm:px-6 lg:px-8">
      {/* ── Section Header (Title & 'See all') ────── */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          {title}
        </h2>
        <Link
          href={seeAllHref}
          className="text-sm sm:text-base font-bold text-green-700 hover:text-green-800 transition-colors"
        >
          See All
        </Link>
      </div>

      {/* ── Products Horizontal Row / Carousel ────── */}
      <div className="relative group/carousel">
        {/* Left Arrow (Desktop) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="hidden sm:flex absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center text-gray-700 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Scroll Container with Snap Alignment */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-1.5 sm:gap-4.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className={`${cardResponsiveClass} h-[175px] sm:h-[370px] bg-white border border-gray-100 rounded-2xl p-1.5 sm:px-4 sm:py-3.5 animate-pulse flex flex-col justify-between`}
              >
                <div>
                  <div className="w-full aspect-square sm:h-44 bg-gray-100 rounded-xl mb-1.5 sm:mb-3"></div>
                  <div className="w-12 sm:w-16 h-2 sm:h-3 bg-gray-100 rounded mb-1 sm:mb-2"></div>
                  <div className="w-full h-3 sm:h-4 bg-gray-100 rounded mb-1"></div>
                </div>
                <div className="pt-1 sm:pt-2 border-t border-gray-50 flex items-center justify-between">
                  <div className="w-10 sm:w-16 h-3 sm:h-4 bg-gray-100 rounded"></div>
                  <div className="hidden sm:block w-full h-8 bg-gray-100 rounded-xl mt-1"></div>
                </div>
              </div>
            ))
          ) : (
            products.map((product) => (
              <div key={product._id} className={cardResponsiveClass}>
                <ProductCard product={product} />
              </div>
            ))
          )}
        </div>

        {/* Right Arrow (Desktop) */}
        {canScrollRight && products.length > 2 && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="hidden sm:flex absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center text-gray-700 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

