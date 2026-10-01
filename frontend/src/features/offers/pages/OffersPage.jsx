import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import offerService from '../offerService.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import useUIStore from '../../../store/uiStore.js';
import { Tag, Copy, Check, Sparkles, Calendar } from 'lucide-react';
import { formatCurrency } from '../../../../../shared/utils/index.js';

export function OffersPage() {
  const navigate = useNavigate();
  const showToast = useUIStore((state) => state.showToast);
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    async function loadOffers() {
      setIsLoading(true);
      try {
        const res = await offerService.getAll({ activeOnly: 'true' });
        setOffers(res.data || []);
      } catch (err) {
        console.error('Failed to load offers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOffers();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast({
      type: 'success',
      title: 'Code Copied',
      message: `Coupon code "${code}" copied to clipboard!`,
    });
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleBookWithOffer = (code) => {
    navigate(`/book?offerCode=${code}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold-700 bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
          Exclusive Promos
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mt-3 mb-3">
          Special Offers & Packages
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          Enjoy premium grooming and rejuvenation at exceptional value. Apply these codes during checkout.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-stone-200 shadow-soft">
              <Skeleton className="h-6 w-1/2 mb-3" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No active offers currently"
          description="Please check back soon for seasonal promotions and festive packages."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {offers.map((offer) => {
            const isPercentage = offer.type === 'PERCENTAGE';
            const discountLabel = isPercentage
              ? `${offer.value}% OFF`
              : `FLAT ${formatCurrency(offer.value)} OFF`;

            return (
              <Card
                key={offer._id}
                className="relative overflow-hidden p-6 border-gold-200/80 bg-gradient-to-br from-white to-gold-50/20"
                hover
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-bold text-gold-700 uppercase tracking-wider block mb-1">
                      {discountLabel}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-stone-900">{offer.title}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-gold-100/80 text-gold-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed mb-6">
                  {offer.description || `Valid on bookings above ${formatCurrency(offer.minOrderAmount)}.`}
                  {offer.maxDiscountAmount && ` Maximum discount: ${formatCurrency(offer.maxDiscountAmount)}.`}
                </p>

                {/* Coupon Code Strip */}
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-semibold uppercase">Coupon Code</span>
                    <span className="font-mono font-bold text-sm tracking-wider text-salon-900">
                      {offer.code}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyCode(offer.code)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
                  >
                    {copiedCode === offer.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={Calendar}
                  onClick={() => handleBookWithOffer(offer.code)}
                >
                  Book with this Offer
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OffersPage;
