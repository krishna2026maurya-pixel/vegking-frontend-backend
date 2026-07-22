import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowRight,
    CheckCircle2,
    Droplets,
    HeartHandshake,
    Leaf,
    MapPin,
    ShieldCheck,
    Sprout,
    Truck,
    UserCheck,
} from 'lucide-react';

export const metadata = {
    title: 'About Us | Organic Vatika',
    description:
        'Learn how Organic Vatika brings fresh, organic, and responsibly sourced farm products to your home.',
};

const strengths = [
    {
        icon: Sprout,
        title: 'Responsible Sourcing',
        text: 'We choose produce from growers and suppliers who care about freshness, soil, and fair everyday trade.',
    },
    {
        icon: Droplets,
        title: 'Clean Handling',
        text: 'Every order is sorted, packed, and handled with hygiene-first steps before it reaches your doorstep.',
    },
    {
        icon: HeartHandshake,
        title: 'Local Support',
        text: 'Your basket helps strengthen nearby farming communities and small supply partners.',
        featured: true,
    },
    {
        icon: Leaf,
        title: 'Seasonal Picks',
        text: 'Our catalog follows what is naturally fresh, useful, and suitable for healthy home cooking.',
    },
    {
        icon: ShieldCheck,
        title: 'Checked Quality',
        text: 'We inspect for freshness, appearance, and usability so you receive dependable products.',
    },
    {
        icon: UserCheck,
        title: 'Customer Care',
        text: 'From subscriptions to order updates, we keep shopping simple and supportive.',
    },
];

const process = [
    'Source from trusted farms and fresh markets',
    'Inspect and sort produce before packing',
    'Pack orders with care for safe doorstep delivery',
    'Support repeat orders through easy subscriptions',
];

const stats = [
    { value: '100%', label: 'fresh picks focus' },
    { value: '7 AM', label: 'daily delivery starts' },
    { value: '4+', label: 'organic categories' },
];

const platformHighlights = [
    {
        title: 'Clear Farm-to-Home Flow',
        text: 'We keep our sourcing and delivery process simple to follow, from daily selection to careful doorstep handover.',
    },
    {
        title: 'One Basket for Daily Needs',
        text: 'Fresh vegetables, fruits, herbs, dairy, seeds, and pantry picks come together in one convenient shopping experience.',
    },
    {
        title: 'Fair Local Partnerships',
        text: 'We value dependable growers and suppliers, helping good produce reach homes while supporting honest local trade.',
    },
];

export default function AboutPage() {
    return (
        <div className="space-y-16 pb-8 md:mx-18 md:my-8">
            <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-7">
                    <div className="inline-flex items-center gap-2 border border-green-200 bg-green-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-green-700">
                        <Sprout className="h-4 w-4" />
                        About Organic Vatika
                    </div>

                    <div className="space-y-5">
                        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-[#1e3b2b] sm:text-4xl lg:text-6xl">
                            Fresh food, honest sourcing, and everyday wellness.
                        </h1>
                        <p className="max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                            Organic Vatika was built for families who want dependable access to fresh vegetables, fruits, dairy, herbs, seeds, and pantry essentials without compromising on quality. We connect careful sourcing with simple online ordering so healthy food fits naturally into daily life.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/products"
                            className="inline-flex h-12 items-center justify-center gap-2 bg-green-600 px-6 text-sm font-extrabold text-white shadow-md shadow-green-700/15 transition hover:bg-green-700"
                        >
                            Shop Products
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/subscriptions"
                            className="inline-flex h-12 items-center justify-center border border-green-700 px-6 text-sm font-extrabold text-green-700 transition hover:bg-green-50"
                        >
                            View Subscriptions
                        </Link>
                    </div>
                </div>

                <div className="relative min-h-[320px] overflow-hidden border border-gray-100 bg-white shadow-xl shadow-green-900/5 sm:min-h-[420px]">
                    <Image
                        src="/images/banner2.jpg"
                        alt="Fresh organic produce arranged for delivery"
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#123524]/80 via-[#123524]/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                        <div className="max-w-md border border-white/20 bg-white/95 p-5 shadow-lg backdrop-blur">
                            <p className="text-xs font-black uppercase tracking-widest text-green-700">Our promise</p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">
                                Bring home food that is thoughtfully selected, carefully packed, and delivered with respect for your time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                    <div key={item.label} className="border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-3xl font-black text-[#1e3b2b] sm:text-4xl">{item.value}</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-500">{item.label}</p>
                    </div>
                ))}
            </section>

            <section className="bg-white py-12">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl">Fresh Grocery Platform</h2>
                    <p className="max-w-4xl text-base leading-7 text-gray-700 sm:text-lg">
                        Bringing local farm care, practical quality checks, and easy online ordering together for everyday households.
                    </p>
                </div>

                <div className="mt-12 grid gap-10 md:grid-cols-3">
                    {platformHighlights.map((item) => (
                        <article key={item.title} className="border-l-4 border-green-600 pl-7">
                            <h3 className="text-lg font-black text-gray-800">{item.title}</h3>
                            <p className="mt-3 text-base leading-8 text-gray-700">{item.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="relative overflow-hidden bg-[#fbfdf9] py-10">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-green-700">Our strengths</p>
                    <h2 className="mt-3 text-3xl font-bold text-[#1e3b2b] sm:text-4xl">Why families choose Organic Vatika</h2>
                    <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
                        We keep the experience practical, fresh, and transparent so your weekly groceries feel easier to trust.
                    </p>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {strengths.map(({ icon: Icon, title, text, featured }) => (
                        <article
                            key={title}
                            className={`group flex min-h-[190px] flex-col items-center justify-start rounded-xl border bg-white px-4 py-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-xl hover:shadow-green-900/10 sm:min-h-[205px] ${featured
                                ? 'border-green-500 shadow-lg shadow-green-900/10'
                                : 'border-gray-100'
                                }`}
                        >
                            <div
                                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition duration-300 ${featured ? 'bg-green-50 text-green-700' : 'bg-green-50 text-green-700 group-hover:bg-green-100'
                                    }`}
                            >
                                <Icon className="h-7 w-7" strokeWidth={2.1} />
                            </div>
                            <h3 className="max-w-[11rem] text-base font-black leading-tight text-gray-950">
                                {title}
                            </h3>
                            <p className="mt-3 max-w-[12rem] text-sm leading-5 text-gray-600">
                                {text}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="grid overflow-hidden border border-gray-100 bg-white shadow-sm lg:grid-cols-2">
                <div className="relative min-h-[280px] lg:min-h-full">
                    <Image
                        src="/images/categories/vegetables.jpg"
                        alt="Fresh vegetables from Organic Vatika"
                        fill
                        className="object-cover"
                    />
                </div>

                <div className="space-y-7 p-6 sm:p-8 lg:p-10">
                    <div className="space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-green-700">How we work</p>
                        <h2 className="text-3xl font-bold text-[#1e3b2b]">From farm-side selection to your kitchen.</h2>
                    </div>

                    <div className="space-y-4">
                        {process.map((step) => (
                            <div key={step} className="flex gap-3">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                                <p className="text-sm font-semibold leading-6 text-gray-700">{step}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-3 border-t border-gray-100 pt-6 sm:grid-cols-2">
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                            <MapPin className="h-5 w-5 text-orange-500" />
                            Fresh Market Road, India
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                            <Truck className="h-5 w-5 text-green-600" />
                            Delivery every day
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#073c2a] px-6 py-10 text-white sm:px-8 lg:px-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-green-200">Healthy habits made simpler</p>
                        <h2 className="text-3xl font-bold sm:text-4xl">Ready to fill your basket with fresh picks?</h2>
                        <p className="text-sm leading-7 text-green-100/80">
                            Explore seasonal products or create a subscription for the items your kitchen needs again and again.
                        </p>
                    </div>
                    <Link
                        href="/products"
                        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-white px-6 text-sm font-extrabold text-[#073c2a] transition hover:bg-green-50"
                    >
                        Start Shopping
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
