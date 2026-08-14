import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import {
    ArrowRight,
    Clock,
    Headphones,
    Mail,
    MessageCircle,
    Phone,
    ShieldCheck,
    Truck,
} from 'lucide-react';

export const metadata = {
    title: 'Contact Us | Organic Vatika',
    description:
        'Contact Organic Vatika for fresh grocery delivery support, order help, subscription questions, and customer care.',
};

const contactMethods = [
    {
        icon: Phone,
        title: 'Call Us',
        value: '+91 98765 43210',
        note: 'Fast help for active orders',
        href: 'tel:+919876543210',
    },
    {
        icon: Mail,
        title: 'Email Support',
        value: 'hello@vegking.local',
        note: 'Best for detailed questions',
        href: 'mailto:hello@vegking.local',
    },
    {
        icon: MessageCircle,
        title: 'Order Help',
        value: 'Chat with support',
        note: 'Delivery, returns, and subscriptions',
        href: '/orders',
    },
];

const serviceDetails = [
    {
        icon: Clock,
        title: 'Support Hours',
        text: 'Every day, 7 AM - 10 PM',
    },
    {
        icon: Truck,
        title: 'Delivery Window',
        text: 'Fresh dispatches begin from 7 AM',
    },
    {
        icon: ShieldCheck,
        title: 'Freshness Care',
        text: 'Tell us quickly if an item needs attention',
    },
];

export default function ContactPage() {
    return (
        <div className="space-y-14 pb-8 mx-auto max-w-8xl px-4 sm:px-6 lg:px-20 mt-8">
            <section className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-7">
                    <div className="inline-flex items-center gap-2 border border-green-200 bg-green-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-green-700">
                        <Headphones className="h-4 w-4" />
                        Contact Organic Vatika
                    </div>

                    <div className="space-y-5">
                        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-[#1e3b2b] sm:text-4xl lg:text-6xl">
                            Need help with your fresh grocery order?
                        </h1>
                        <p className="max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                            Our team is here for order updates, delivery questions, subscription support, and product quality care. Reach out and we will help you keep your kitchen stocked without stress.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:max-w-2xl">
                        {serviceDetails.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="border border-gray-100 bg-white p-4 shadow-sm">
                                <Icon className="h-5 w-5 text-green-600" />
                                <h2 className="mt-3 text-sm font-black text-gray-900">{title}</h2>
                                <p className="mt-1 text-xs font-semibold leading-5 text-gray-500">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <ContactForm />
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                {contactMethods.map(({ icon: Icon, title, value, note, href }) => (
                    <Link
                        key={title}
                        href={href}
                        className="group border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-green-300 hover:shadow-xl hover:shadow-green-900/10"
                    >
                        <div className="flex h-12 w-12 items-center justify-center bg-green-50 text-green-700 transition group-hover:bg-green-600 group-hover:text-white">
                            <Icon className="h-5 w-5" />
                        </div>
                        <h2 className="mt-5 text-lg font-black text-gray-900">{title}</h2>
                        <p className="mt-2 break-words text-sm font-extrabold text-[#1e3b2b]">{value}</p>
                        <p className="mt-2 text-sm leading-6 text-gray-500">{note}</p>
                    </Link>
                ))}
            </section>

        </div>
    );
}
