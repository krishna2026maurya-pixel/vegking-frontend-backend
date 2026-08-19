import Link from 'next/link';

export default function BlogCard({ blog }: { blog: any }) {
  return (
    <Link href={`/blog/${blog.id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all group-hover:shadow-md fade-in">
        <div className="aspect-[16/10] overflow-hidden">
          <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="p-6">
          <span className="text-xs font-semibold text-primary mb-2 block">{blog.date}</span>
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">{blog.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{blog.excerpt}</p>
        </div>
      </div>
    </Link>
  );
}
