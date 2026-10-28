import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Heart } from 'lucide-react';

const Marketplace = () => {
  console.log('Marketplace rendered');
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 text-center">Marketplace</h1>
        <p className="text-center text-slate-600 mb-8">
          Explore the marketplace: sell your recyclable waste and donate surplus food to NGOs. Earn points, support the community, and make a sustainable impact.
        </p>

        {/* Sell Your Waste Section */}
        <section className="mb-12 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShoppingBag className="h-4 w-4" /> Sell Your Waste
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Sell Your Waste</h2>
          <p className="text-slate-600 mb-4">
            List recyclable waste (plastic, paper, metal, e-waste, etc.) and connect with nearby collectors who will purchase it. Earn money while keeping the environment clean.
          </p>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Start Selling <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Donate Food Section */}
        <section className="rounded-2xl border border-amber-100 bg-amber-50/50 p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            <Heart className="h-4 w-4" /> Donate Food
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Donate Food</h2>
          <p className="text-slate-600 mb-4">
            Share surplus fresh food with local NGOs and community kitchens. Reduce food waste and help those in need.
          </p>
          <Link
            to="/donate-food"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Donate Now <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Marketplace;
