import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import serviceService from '../serviceService.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import SearchInput from '../../../components/common/SearchInput.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import useDebounce from '../../../hooks/useDebounce.js';
import { Clock, Tag, Scissors, Sparkles } from 'lucide-react';
import { formatCurrency, formatDuration } from '../../../../../shared/utils/index.js';

export function ServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [servicesRes, catRes] = await Promise.all([
          serviceService.getAll({ activeOnly: 'true' }),
          serviceService.getCategories(),
        ]);
        setServices(servicesRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Performance rule #11: useMemo for filtering list
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat =
        selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchSearch =
        !debouncedSearch ||
        s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [services, selectedCategory, debouncedSearch]);

  const handleBookService = (serviceId) => {
    navigate(`/book?serviceId=${serviceId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-salon-700 bg-salon-50 px-3.5 py-1.5 rounded-full border border-salon-200/80 mb-3 shadow-xs">
          Treatment Menu
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-stone-900 tracking-tight mb-3.5">
          Our Curated Services
        </h1>
        <p className="text-sm sm:text-base text-stone-500 leading-relaxed max-w-xl mx-auto">
          From rejuvenating spa rituals and bespoke haircuts to radiant facials, explore our master-crafted treatments.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 sm:space-y-5 mb-10">
        {/* Top Controls Row: Search Input + Status & Clear Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search treatments by name, description..."
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-500 font-medium self-start sm:self-center px-1">
            <span>
              Showing <strong className="font-semibold text-stone-900">{filteredServices.length}</strong> {filteredServices.length === 1 ? 'treatment' : 'treatments'}
            </span>
            {(selectedCategory !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
                className="text-salon-700 hover:text-salon-900 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-salon-800 text-white shadow-sm ring-2 ring-salon-800/20'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 hover:text-stone-900'
            }`}
          >
            All Treatments ({services.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.category}
              type="button"
              onClick={() => setSelectedCategory(c.category)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === c.category
                  ? 'bg-salon-800 text-white shadow-sm ring-2 ring-salon-800/20'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 hover:text-stone-900'
              }`}
            >
              {c.category} ({c.activeCount})
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-stone-200 shadow-soft">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No treatments match your criteria"
          description="Try changing your search term or selecting a different category."
          actionLabel="Clear Filters"
          onAction={() => {
            setSelectedCategory('ALL');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredServices.map((service) => (
            <Card
              key={service._id}
              className="flex flex-col justify-between p-6 hover:border-salon-400 group"
              hover
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <Badge variant="salon">{service.category}</Badge>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{formatDuration(service.duration)}</span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-display font-bold text-stone-900 mb-2 group-hover:text-salon-800 transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed line-clamp-3 mb-6 min-h-[3rem]">
                  {service.description || 'Custom tailored salon therapy using premium salon-grade formulas.'}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between mt-auto">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider block">Price</span>
                  <span className="text-lg font-display font-bold text-stone-900">
                    {formatCurrency(service.price)}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleBookService(service._id)}
                  className="shadow-sm"
                >
                  Book Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ServicesPage;
