import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

async function getBusiness(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('public_business_profiles')
    .select('id, name, slug, phone, default_price, address, bio')
    .eq('slug', slug)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);

  if (!business) {
    return { title: 'Barbershop Not Found' };
  }

  return {
    title: `${business.name} — Book a Haircut`,
    description:
      business.bio ??
      `Book a haircut at ${business.name} on BarbFlow. Standard haircut from ₦${Number(
        business.default_price
      ).toLocaleString()}.`,
  };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusiness(slug);

  if (!business) {
    notFound();
  }

  const supabase = await createClient();
  const { data: services } = await supabase
    .from('public_business_services')
    .select('id, name, price')
    .eq('business_id', business.id)
    .order('price', { ascending: true });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-brand-600 hover:underline">
          &larr; Back to BarbFlow
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">{business.name}</h1>
        {business.address && <p className="text-neutral-500 mb-1">{business.address}</p>}
        {business.phone && (
          <p className="text-neutral-600 mb-4">
            <a href={`tel:${business.phone}`} className="hover:underline">
              {business.phone}
            </a>
          </p>
        )}
        {business.bio && <p className="text-neutral-700 mb-8">{business.bio}</p>}

        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Services &amp; Pricing</h2>
          <ul className="divide-y divide-neutral-100">
            <li className="flex justify-between py-3">
              <span>Haircut</span>
              <span className="font-medium">₦{Number(business.default_price).toLocaleString()}</span>
            </li>
            {(services ?? []).map((s) => (
              <li key={s.id} className="flex justify-between py-3">
                <span>{s.name}</span>
                <span className="font-medium">₦{Number(s.price).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">Ready to book?</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Already a BarbFlow customer here? Sign in to book your next visit. New customers are added in-shop by
            staff — just ask when you visit {business.name}.
          </p>
          <Link href="/login" className="btn-primary inline-block">
            Sign in to book
          </Link>
        </div>
      </div>
    </div>
  );
}
