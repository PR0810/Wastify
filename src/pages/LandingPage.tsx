import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Leaf, Menu, X, ArrowRight, Play, Trash2, MapPin, Camera, Trophy, BookOpen,
  Truck, Shield, Users, GraduationCap, Navigation, Recycle, Utensils, CheckCircle2,
  AlertCircle, Mail, Phone, Send, Facebook, Twitter, Instagram, Linkedin, TrendingUp,
  Sparkles, Heart, Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export function LandingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRole, setContactRole] = useState('Citizen');
  const [contactMessage, setContactMessage] = useState('');

  // Animated counters
  const [counts, setCounts] = useState({ waste: 0, meals: 0, users: 0, areas: 0 });
  const countersRef = useRef<HTMLDivElement>(null);
  const countersAnimated = useRef(false);

  const targetCounts = { waste: 12500, meals: 3200, users: 4800, areas: 35 };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !countersAnimated.current) {
          countersAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const interval = duration / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setCounts({
              waste: Math.floor(targetCounts.waste * eased),
              meals: Math.floor(targetCounts.meals * eased),
              users: Math.floor(targetCounts.users * eased),
              areas: Math.floor(targetCounts.areas * eased),
            });
            if (step >= steps) clearInterval(timer);
          }, interval);
        }
      },
      { threshold: 0.3 }
    );
    if (countersRef.current) observer.observe(countersRef.current);
    return () => observer.disconnect();
  }, []);

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
            entry.target.classList.remove('opacity-0', 'translate-y-4');
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.classList.add('opacity-0', 'translate-y-4', 'transition-all', 'duration-700');
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactLoading(true);
    setContactError(null);
    const { error } = await supabase.from('contact_messages').insert({
      name: contactName,
      email: contactEmail,
      role: contactRole,
      message: contactMessage,
    });
    setContactLoading(false);
    if (error) {
      setContactError('Could not send message. Please try again.');
      return;
    }
    setContactSent(true);
    setContactName(''); setContactEmail(''); setContactRole('Citizen'); setContactMessage('');
    setTimeout(() => setContactSent(false), 4000);
  }

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Learn', href: '#learn' },
    { label: 'Marketplace', href: '#marketplace' },
    // About Us link removed per user request
    { label: 'Contact', href: '#contact' },
  ];

  const howItWorks = [
    { icon: Trash2, title: 'Segregate', desc: 'Separate your waste into the right bins — wet, dry, and recyclable.' },
    { icon: MapPin, title: 'Flag Pickup', desc: 'Mark your waste as ready for pickup and get matched with a nearby driver.' },
    { icon: Navigation, title: 'Track', desc: 'Follow the collection vehicle in real-time on the map until it reaches you.' },
    { icon: Trophy, title: 'Earn', desc: 'Collect reward points for proper segregation and reporting, redeem for benefits.' },
  ];

  const features = [
    { icon: Trash2, title: '3-Bin Segregation', desc: 'Smart color-coded bins for wet, dry, and recyclable waste with clear guidance.' },
    { icon: Utensils, title: 'Food Redistribution', desc: 'Donate surplus fresh food to verified NGOs for distribution to those in need.' },
    { icon: Navigation, title: 'GPS Tracking', desc: 'Real-time vehicle tracking so citizens know exactly when the truck arrives.' },
    { icon: Camera, title: 'Report Dumping', desc: 'Report illegal waste dumping and overflowing bins with photos and location.' },
    { icon: Award, title: 'Cash Rewards', desc: 'Earn points for good behavior — proper segregation, reporting, and participation.' },
    { icon: BookOpen, title: 'Learning Hub', desc: 'Age-appropriate lessons, games, quizzes, and certificates for students.' },
  ];

  const roles = [
    {
      icon: Users,
      title: 'Citizen',
      color: 'emerald',
      benefits: ['Report waste dumping with photos', 'Track collection vehicles live', 'Donate surplus food to NGOs', 'Earn rewards for good behavior', 'Access learning modules'],
    },
    {
      icon: Truck,
      title: 'Driver',
      color: 'amber',
      benefits: ['Get assigned routes and areas', 'Start trips and log waste collected', 'Share live GPS with citizens', 'Receive tasks and update status', 'View assignment details'],
    },
    {
      icon: Shield,
      title: 'Admin',
      color: 'blue',
      benefits: ['Assign drivers to areas', 'Monitor all waste reports', 'Track vehicles on live map', 'Award points to users', 'Manage areas and assignments'],
    },
    {
      icon: Heart,
      title: 'NGO',
      color: 'amber',
      benefits: ['Coordinate food redistribution', 'Educate communities on waste segregation', 'Partner with drivers for collection', 'Access impact data and reports'],
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; btn: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', btn: 'bg-amber-500 hover:bg-amber-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', btn: 'bg-blue-600 hover:bg-blue-700' },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ==================== 1. NAVBAR ==================== */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#home" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">Wastify</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              link.href.startsWith('/') ? (
                <Link key={link.href} to={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                  {link.label}
                </a>
              )
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {session ? (
              <button onClick={() => navigate('/app')} className="btn-primary text-sm">
                Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <Link to="/signin" className="btn-secondary text-sm">Login</Link>
                <Link to="/signup" className="btn-primary text-sm">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
              {session ? (
                <button onClick={() => navigate('/app')} className="btn-primary w-full text-sm">Dashboard</button>
              ) : (
                <>
                  <Link to="/signin" className="btn-secondary flex-1 text-sm">Login</Link>
                  <Link to="/signup" className="btn-primary flex-1 text-sm">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ==================== 2. HERO ==================== */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-emerald-50 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Smart Waste Management Platform
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Waste sorted.<br />Future secured.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-emerald-50 lg:mx-0">
                Connecting citizens, drivers, administrators, and NGO partners to manage waste efficiently — from segregation and collection to recycling, food rescue, and education.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-emerald-700 shadow-lg transition-transform hover:scale-105 active:scale-100">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Link>
                <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                  <Play className="h-5 w-5" /> Watch Demo
                </button>
              </div>
            </div>

            {/* 3 bins visual */}
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              {[
                { color: 'from-blue-400 to-blue-600', label: 'Wet', icon: '💧' },
                { color: 'from-amber-400 to-amber-600', label: 'Dry', icon: '🗑️' },
                { color: 'from-green-400 to-green-600', label: 'Recycle', icon: '♻️' },
              ].map((bin, i) => (
                <div
                  key={bin.label}
                  className="flex flex-col items-center"
                  style={{ animation: `slideUp 0.6s ease-out ${i * 0.15}s both` }}
                >
                  <div className={`flex h-28 w-20 items-center justify-center rounded-t-2xl bg-gradient-to-b ${bin.color} shadow-xl sm:h-36 sm:w-24`}>
                    <span className="text-3xl sm:text-4xl">{bin.icon}</span>
                  </div>
                  <div className="h-3 w-full rounded-b-lg bg-slate-800/80" />
                  <p className="mt-3 text-sm font-semibold text-white">{bin.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 3. PROBLEM → SOLUTION ==================== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div data-reveal className="rounded-2xl border border-red-100 bg-red-50/50 p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              <AlertCircle className="h-3.5 w-3.5" /> The Problem
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Waste is piling up, and nobody knows where it goes</h3>
            <ul className="mt-4 space-y-3">
              {['Mixed waste ends up in landfills instead of being recycled', 'Citizens have no visibility into collection schedules', 'Surplus food goes to waste while people go hungry', 'Illegal dumping goes unreported and unaddressed'].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> The Wastify Solution
            </div>
            <h3 className="text-2xl font-bold text-slate-900">A connected platform that makes waste management simple</h3>
            <ul className="mt-4 space-y-3">
              {['Smart 3-bin segregation with clear guidance for every household', 'Real-time GPS tracking of collection vehicles on live maps', 'Food redistribution network connecting donors with NGOs', 'Photo-based dumping reports routed directly to administrators'].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ==================== 4. HOW IT WORKS ==================== */}
      <section id="how-it-works" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center" data-reveal>
            <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
            <p className="mt-2 text-slate-500">Our 4‑step flow</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="card-hover relative p-6 text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white shadow-md">Step 1</div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Trash2 className="h-7 w-7" /></div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Segregate &amp; Scan</h3>
              <p className="mt-2 text-sm text-slate-500">Log segregates waste at home and adds the details on the app.</p>
            </div>
            {/* Step 2 */}
            <div className="card-hover relative p-6 text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white shadow-md">Step 2</div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><MapPin className="h-7 w-7" /></div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Smart Collection</h3>
              <p className="mt-2 text-sm text-slate-500">Driver collects waste using live GPS. Smart bins send an alert when full.</p>
            </div>
            {/* Step 3 */}
            <div className="card-hover relative p-6 text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white shadow-md">Step 3</div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Navigation className="h-7 w-7" /></div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Recycle &amp; Redistribute</h3>
              <p className="mt-2 text-sm text-slate-500">Recyclable waste goes to NGOs, and leftover food is collected for those in need.</p>
            </div>
            {/* Step 4 */}
            <div className="card-hover relative p-6 text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white shadow-md">Step 4</div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Trophy className="h-7 w-7" /></div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Earn &amp; Monitor</h3>
              <p className="mt-2 text-sm text-slate-500">Citizens earn reward points, and the admin monitors everything in real time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 5. FEATURES ==================== */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center" data-reveal>
          <h2 className="text-3xl font-bold text-slate-900">Platform Features</h2>
          <p className="mt-2 text-slate-500">Everything you need for effective waste management</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} data-reveal className="card-hover group p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 6. LEARN ==================== */}
      <section id="learn" className="bg-gradient-to-b from-slate-50 to-emerald-50/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center" data-reveal>
            <h2 className="text-3xl font-bold text-slate-900">Learn & Grow</h2>
            <p className="mt-2 text-slate-500">Education for every age group</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div data-reveal className="card-hover p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">Kids (Ages 5-13)</h3>
              <p className="mt-2 text-sm text-slate-500">Game-based learning that makes waste management fun and engaging.</p>
              <ul className="mt-4 space-y-2">
                {['Interactive sorting games', 'Fun quizzes with badges', 'Colorful animated lessons'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" /> {item}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700">
                Start learning <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div data-reveal className="card-hover p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">Teens & Adults (14+)</h3>
              <p className="mt-2 text-sm text-slate-500">Lessons, videos, quizzes, and certificates for deeper understanding.</p>
              <ul className="mt-4 space-y-2">
                {['Video lessons with experts', 'Quiz-based assessments', 'Certificates of completion', 'Biogas & composting guides'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                Explore courses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 7. ROLES ==================== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center" data-reveal>
          <h2 className="text-3xl font-bold text-slate-900">Choose Your Role</h2>
          <p className="mt-2 text-slate-500">Everyone has a part to play in keeping our communities clean</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {roles.map((role) => {
            const c = colorMap[role.color];
            return (
              <div key={role.title} data-reveal className="card-hover flex flex-col p-6">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.bg} ${c.text}`}>
                  <role.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{role.title}</h3>
                <ul className="mt-4 flex-1 space-y-2">
                  {role.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${c.text}`} /> {b}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl ${c.btn} px-5 py-2.5 text-sm font-semibold text-white transition-all`}>
                  Join as {role.title} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== 8. IMPACT COUNTERS ==================== */}
      <section ref={countersRef} className="bg-gradient-to-br from-emerald-700 to-teal-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center" data-reveal>
            <h2 className="text-3xl font-bold text-white">Our Impact So Far</h2>
            <p className="mt-2 text-emerald-100">Real numbers, real change</p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { icon: Trash2, label: 'Kg Waste Managed', value: counts.waste, suffix: ' kg' },
              { icon: Utensils, label: 'Meals Saved', value: counts.meals, suffix: '' },
              { icon: Users, label: 'Active Users', value: counts.users, suffix: '' },
              { icon: MapPin, label: 'Areas Covered', value: counts.areas, suffix: '' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm">
                <stat.icon className="mx-auto h-8 w-8 text-emerald-200" />
                <p className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                  {stat.value.toLocaleString()}{stat.suffix}
                </p>
                <p className="mt-1 text-sm text-emerald-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== MARKETPLACE ==================== */}
      <section id="marketplace" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center" data-reveal>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
              <Recycle className="h-3.5 w-3.5" /> Marketplace
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Marketplace</h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-500">
              Sell your recyclable waste and donate surplus food — earn rewards while making a sustainable impact.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Sell Your Waste */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md" data-reveal>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Recycle className="h-4 w-4" /> Sell Your Waste
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Sell Your Waste</h3>
              <p className="text-slate-600 mb-6">
                List recyclable waste (plastic, paper, metal, e-waste, etc.) and connect with nearby collectors
                who will purchase it. Earn money while keeping the environment clean.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> List plastic, paper, metal & e-waste</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Connect with nearby collectors</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Earn money for your recyclables</li>
              </ul>
            </div>

            {/* Donate Food */}
            <div className="rounded-2xl border border-amber-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md" data-reveal>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                <Heart className="h-4 w-4" /> Donate Food
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Donate Food</h3>
              <p className="text-slate-600 mb-6">
                Share surplus fresh food with local NGOs and community kitchens. Reduce food waste and help those
                in need.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" /> Share surplus food with NGOs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" /> Support community kitchens</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" /> Reduce food waste, feed the needy</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 9. CONTACT ==================== */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div data-reveal>
            <h2 className="text-3xl font-bold text-slate-900">Get in Touch</h2>
            <p className="mt-2 text-slate-500">Have questions? Want to partner with us? Send us a message.</p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Email</p>
                  <p className="text-sm text-slate-500">hello@wastify.in</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Phone</p>
                  <p className="text-sm text-slate-500">+91 98765 43210</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Social</p>
                  <div className="mt-1 flex gap-2">
                    {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                      <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-emerald-100 hover:text-emerald-600">
                        <Icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div data-reveal className="card p-6">
            {contactSent ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <p className="mt-4 text-lg font-bold text-slate-900">Message sent!</p>
                <p className="mt-1 text-sm text-slate-500">We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} className="input" placeholder="Your name" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="input" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="label">Your Role</label>
                  <select value={contactRole} onChange={(e) => setContactRole(e.target.value)} className="input">
                    <option>Citizen</option>
                    <option>Driver</option>
                    <option>Admin</option>
                    <option>NGO / Recycler</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea required value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} className="input min-h-[120px]" placeholder="Tell us what you need..." />
                </div>
                {contactError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" /> {contactError}
                  </div>
                )}
                <button type="submit" disabled={contactLoading} className="btn-primary w-full">
                  <Send className="h-4 w-4" /> {contactLoading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ==================== 10. FOOTER ==================== */}
      <footer className="border-t border-slate-200 bg-slate-900 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Leaf className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-white">Wastify</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">Empowering communities for sustainable waste management. Segregate, track, recycle, and earn rewards.</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Quick Links</p>
              <ul className="mt-3 space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-slate-400 transition-colors hover:text-emerald-400">{link.label}</a>
                  </li>
                ))}
                <li><Link to="/signup" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Sign Up</Link></li>
                <li><Link to="/signin" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Login</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Connect With Us</p>
              <div className="mt-3 flex gap-2">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-emerald-600 hover:text-white">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-1 text-sm text-slate-400">
                <TrendingUp className="h-4 w-4 text-emerald-400" /> Built for a cleaner tomorrow
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-6 text-center">
            <p className="text-xs text-slate-500">© 2026 Wastify. All rights reserved. Built for a cleaner tomorrow.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
