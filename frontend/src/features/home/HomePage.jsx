import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import serviceService from '../services/serviceService.js';
import staffService from '../staff/staffService.js';
import offerService from '../offers/offerService.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import {
  Sparkles,
  Calendar,
  Clock,
  Award,
  ShieldCheck,
  Heart,
  ChevronRight,
  Star,
  CheckCircle,
} from 'lucide-react';
import { formatCurrency, formatDuration } from '../../../../shared/utils/index.js';
import config from '../../config/index.js';

export function HomePage() {
  const navigate = useNavigate();
  const [featuredServices, setFeaturedServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [activeOffers, setActiveOffers] = useState([]);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [servicesRes, staffRes, offersRes] = await Promise.all([
          serviceService.getAll({ activeOnly: 'true' }),
          staffService.getAll({ activeOnly: 'true' }),
          offerService.getAll({ activeOnly: 'true' }),
        ]);

        setFeaturedServices((servicesRes.data || []).slice(0, 4));
        setStylists((staffRes.data || []).slice(0, 3));
        setActiveOffers((offersRes.data || []).slice(0, 2));
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      }
    }
    loadHomeData();
  }, []);

  return (
    <div className="space-y-24 sm:space-y-36 pb-28">
      {/* Hero Section with Side Ambient Lighting & Floating Accents */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100 via-stone-50/70 to-white pt-20 pb-28 sm:pt-32 sm:pb-40 border-b border-stone-200/60">
        {/* Background Ambient Glows */}
        <div className="absolute top-10 -left-24 w-96 h-96 rounded-full bg-salon-200/35 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute top-16 -right-24 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl pointer-events-none animate-float-reverse" />

        {/* Side Floating Badge Left (Desktop) */}
        <div className="hidden xl:flex absolute top-1/3 left-6 2xl:left-14 z-20 items-center gap-3.5 p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-premium animate-float pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 font-bold">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-stone-900 tracking-tight">4.9 / 5.0 Rating</p>
            <p className="text-[11px] text-stone-500">2,400+ Verified Guests</p>
          </div>
        </div>

        {/* Side Floating Badge Right (Desktop) */}
        <div className="hidden xl:flex absolute bottom-1/4 right-6 2xl:right-14 z-20 items-center gap-3.5 p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-premium animate-float-reverse pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
            <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-stone-900 tracking-tight">100% Organic Products</p>
            <p className="text-[11px] text-stone-500">Cruelty-Free Formulas</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-salon-100/90 border border-salon-300 text-salon-900 text-xs font-semibold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-top-3 duration-500 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Luxury Hair, Skin & Wellness Rituals</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-stone-900 tracking-tight max-w-4xl mx-auto leading-[1.12] mb-8">
            Where Elegance Meets <br className="hidden sm:inline" />
            <span className="luxury-gradient-text">Exceptional Care</span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed mb-12 font-normal">
            Immerse yourself in bespoke beauty treatments and therapeutic styling delivered by master artisans at {config.SALON_NAME}.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link to="/book" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-base px-9 py-4.5 shadow-xl shadow-salon-900/20 hover:scale-[1.02] transition-transform duration-300"
                icon={Calendar}
              >
                Book Your Appointment
              </Button>
            </Link>

            <Link to="/services" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full text-base px-9 py-4.5 hover:scale-[1.02] transition-transform duration-300"
              >
                Explore Treatment Menu
              </Button>
            </Link>
          </div>

          {/* Trust badges with generous spacing */}
          <div className="mt-18 pt-10 border-t border-stone-200/80 flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-xs text-stone-500 font-medium">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <span>Pristine Hygiene & Sanitization</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Heart className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <span>100% Cruelty-Free Formulations</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Award className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <span>Certified Master Stylists</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services with Generous Spacing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-salon-700 bg-salon-50 px-3.5 py-1.5 rounded-full border border-salon-200 inline-block mb-3">
              Signature Treatments
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight">
              Crafted For Your Radiance
            </h2>
          </div>
          <Link
            to="/services"
            className="text-sm font-semibold text-salon-800 hover:text-salon-950 flex items-center gap-1.5 group transition-colors"
          >
            <span>View All Services</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredServices.map((svc) => (
            <Card
              key={svc._id}
              className="flex flex-col justify-between p-7 rounded-3xl card-hover-lift group border border-stone-200/80 bg-white"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <Badge variant="salon">{svc.category}</Badge>
                  <span className="text-xs text-stone-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {formatDuration(svc.duration)}
                  </span>
                </div>

                <h3 className="text-lg font-display font-bold text-stone-900 mb-2 group-hover:text-salon-800 transition-colors">
                  {svc.name}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-3 mb-8">
                  {svc.description || 'Luxurious pampering designed specifically for restorative care and luminous finish.'}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-lg font-display font-bold text-stone-900">
                  {formatCurrency(svc.price)}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/book?serviceId=${svc._id}`)}
                  className="px-4 py-2"
                >
                  Book
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Promotional Offers Banner */}
      {activeOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-salon-950 via-stone-900 to-salon-900 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Ambient decorative sheen */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-xl relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3 block">
                Seasonal Privilege
              </span>
              <h3 className="text-2xl sm:text-4xl font-display font-extrabold mb-4 tracking-tight">
                {activeOffers[0].title}
              </h3>
              <p className="text-sm text-stone-300 leading-relaxed mb-6">
                Use code <span className="font-mono font-bold text-amber-300 bg-white/10 px-2.5 py-1 rounded-md border border-white/20">{activeOffers[0].code}</span> during checkout.
                {' '}{activeOffers[0].description}
              </p>
            </div>

            <Link to={`/book?offerCode=${activeOffers[0].code}`} className="shrink-0 relative z-10">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white hover:bg-stone-100 text-salon-950 font-bold px-9 py-4 shadow-lg hover:scale-105 transition-transform"
              >
                Claim Offer & Book
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Master Stylists */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-salon-700 bg-salon-50 px-3.5 py-1.5 rounded-full border border-salon-200 inline-block mb-3">
            Expert Stylists
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight mb-3">
            Meet Our Resident Specialists
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            Passionate artists dedicated to perfecting your personal look with precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stylists.map((st) => (
            <Card key={st._id} className="p-8 text-center rounded-3xl card-hover-lift border border-stone-200/80 bg-white">
              <Avatar
                src={st.avatarUrl}
                name={st.name}
                size="xl"
                className="mx-auto mb-5 ring-4 ring-salon-100"
              />
              <h3 className="text-lg font-display font-bold text-stone-900 mb-1.5">{st.name}</h3>
              <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-6">{st.bio}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full py-2.5"
                onClick={() => navigate(`/book?staffId=${st._id}`)}
              >
                Schedule Appointment
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Client Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-salon-700 bg-salon-50 px-3.5 py-1.5 rounded-full border border-salon-200 inline-block mb-3">
            Client Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight">
            Loved By Over 2,400+ Patrons
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Meera Kapoor',
              role: 'Regular Patron',
              text: 'The Hydra-Boost Facial with Ananya was transcendent. My skin had an effortless, natural glow for weeks!',
              rating: 5,
            },
            {
              name: 'Rohan Deshmukh',
              role: 'Executive Member',
              text: 'Priya does precision haircuts like no one else. Exceptional cleanliness, relaxing ambiance, and prompt service.',
              rating: 5,
            },
            {
              name: 'Dr. Shalini Sen',
              role: 'Weekend Guest',
              text: 'The Swedish aromatherapy massage completely relieved my weekday stress. Highly recommend booking early!',
              rating: 5,
            },
          ].map((t, idx) => (
            <Card key={idx} className="p-8 rounded-3xl flex flex-col justify-between card-hover-lift border border-stone-200/80 bg-white">
              <div>
                <div className="flex items-center gap-1 text-gold-500 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4.5 h-4.5 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className="text-sm text-stone-600 leading-relaxed italic mb-6">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-salon-100 border border-salon-300 text-salon-800 font-display font-bold flex items-center justify-center text-xs">
                  {t.name[0]}
                </div>
                <div>
                  <span className="block text-xs font-bold text-stone-900">{t.name}</span>
                  <span className="block text-[11px] text-stone-400">{t.role}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;  
