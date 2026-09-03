'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { blogs, BlogPost } from '@/lib/blogs';
import BlogCard from '@/components/BlogCard';
import { ArrowLeft, Share2, CheckCircle2, BookOpen } from 'lucide-react';

export default function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const blogId = resolvedParams.id;

  const blog = blogs.find((b) => b.id === blogId) || blogs[0];
  const relatedBlogs = blogs.filter((b) => b.id !== blog.id);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: blog.title,
          text: blog.subtitle,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Article link copied to clipboard!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-20">
      {/* ── Minimal Top Navigation Header ── */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
            All Articles
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200/80 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-gray-500" />
            Share
          </button>
        </div>
      </nav>

      {/* ── Main Article Container ── */}
      <main className="max-w-3xl mx-auto px-4 pt-10 sm:pt-14">
        {/* Article Meta Category */}
        <div className="mb-4">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
            {blog.category}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-950 leading-[1.25] mb-4">
          {blog.title}
        </h1>

        {/* Subtitle / Lead */}
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal mb-8">
          {blog.subtitle}
        </p>

        {/* Author & Date Bar */}
        <div className="flex items-center gap-3.5 pb-8 border-b border-gray-100 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
            {blog.author.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {blog.author}
              <span className="text-xs font-medium text-gray-400 block sm:inline sm:ml-2 font-normal">
                {blog.authorRole}
              </span>
            </p>
            <p className="text-xs font-medium text-gray-400 mt-0.5">
              Published {blog.date} • {blog.readTime}
            </p>
          </div>
        </div>

        {/* Featured Image */}
        <figure className="mb-10">
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
          {blog.imageCaption && (
            <figcaption className="text-center text-xs text-gray-400 mt-2.5 font-medium italic">
              {blog.imageCaption}
            </figcaption>
          )}
        </figure>

        {/* Article Body Content */}
        <article className="prose prose-gray max-w-none">
          {blog.sections.map((section, idx) => (
            <div key={idx} className="mb-8">
              {section.heading && (
                <h2 className="text-xl font-bold text-gray-950 tracking-tight mb-3 mt-8">
                  {section.heading}
                </h2>
              )}
              {section.paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="text-base sm:text-[17px] text-gray-700 leading-relaxed font-normal mb-4">
                  {para}
                </p>
              ))}
            </div>
          ))}
        </article>

        {/* Key Points Callout Box */}
        {blog.keyPoints && blog.keyPoints.length > 0 && (
          <div className="my-10 p-6 sm:p-8 bg-gray-900 text-white rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Key Takeaways
            </h3>
            <ul className="space-y-3">
              {blog.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-200 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Author Bio Box */}
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 my-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-extrabold text-base flex items-center justify-center shrink-0 border border-primary/20">
            {blog.author.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">About the Author</p>
            <h4 className="text-sm font-bold text-gray-900">{blog.author}</h4>
            <p className="text-xs text-gray-500 font-medium">{blog.authorRole}</p>
          </div>
        </div>

        {/* ── Related Articles Section ── */}
        {relatedBlogs.length > 0 && (
          <div className="pt-10 border-t border-gray-100 mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-gray-950 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Further Reading
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {relatedBlogs.map((b) => (
                <BlogCard key={b.id} blog={b} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
