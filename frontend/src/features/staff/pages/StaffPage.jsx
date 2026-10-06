import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import staffService from '../staffService.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { Sparkles, Calendar, Award, Star, MessageSquare } from 'lucide-react';
import StaffReviewsModal from '../components/StaffReviewsModal.jsx';

export function StaffPage() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStaffForReviews, setSelectedStaffForReviews] = useState(null);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const res = await staffService.getAll({ activeOnly: 'true' });
      setStaffList(res.data || []);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleBookWithStaff = (staffId) => {
    navigate(`/book?staffId=${staffId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-semibold uppercase tracking-widest text-salon-700 bg-salon-50 px-3 py-1 rounded-full border border-salon-200">
          Our Artisans
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-stone-900 tracking-tight mt-3 mb-3">
          Meet Our Master Specialists
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          Highly trained hair artists, certified aesthetic therapists, and wellness professionals dedicated to your pampering.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-stone-200 shadow-soft">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-4" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <EmptyState
          title="No stylists available"
          description="Check back soon as our roster updates."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map((stylist) => (
            <Card
              key={stylist._id}
              className="flex flex-col justify-between p-6 hover:border-salon-400 group"
              hover
            >
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <Avatar
                    src={stylist.avatarUrl}
                    name={stylist.name}
                    size="lg"
                    className="group-hover:scale-105 transition-transform shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-display font-bold text-stone-900 group-hover:text-salon-800 transition-colors truncate">
                      {stylist.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStaffForReviews(stylist);
                        }}
                        className="inline-flex items-center gap-1 font-bold text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 transition-colors cursor-pointer"
                        title="Click to view client feedback & reviews"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                        <span>{Number(stylist.rating || 5.0).toFixed(1)}</span>
                        <span className="text-[10px] font-normal text-stone-500">
                          ({stylist.reviewCount || 0})
                        </span>
                      </button>

                      <div className="flex items-center gap-1 text-[11px] text-salon-600 font-medium">
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>{stylist.services?.length || 0} Specialities</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed mb-4">
                  {stylist.bio || 'Experienced salon professional offering personalized styling and treatments.'}
                </p>

                {stylist.services?.length > 0 && (
                  <div className="mb-6">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
                      Expertise
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {stylist.services.slice(0, 3).map((svc) => (
                        <Badge key={svc._id} variant="stone" className="text-[11px]">
                          {svc.name}
                        </Badge>
                      ))}
                      {stylist.services.length > 3 && (
                        <span className="text-[11px] text-stone-400 px-1.5 py-0.5">
                          +{stylist.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Star}
                  onClick={() => setSelectedStaffForReviews(stylist)}
                  className="text-stone-700 hover:text-amber-700 hover:border-amber-300"
                >
                  Reviews ({stylist.reviewCount || 0})
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="shadow-sm"
                  icon={Calendar}
                  onClick={() => handleBookWithStaff(stylist._id)}
                >
                  Book Stylist
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Staff Reviews Modal */}
      <StaffReviewsModal
        staff={selectedStaffForReviews}
        isOpen={Boolean(selectedStaffForReviews)}
        onClose={() => setSelectedStaffForReviews(null)}
        onReviewAdded={loadStaff}
      />
    </div>
  );
}

export default StaffPage;
