'use client';

import { memo } from 'react';

interface CategoryStats {
  total: number;
  approved: number;
}

interface CategoryNavProps {
  categories: string[];
  activeCategory: string;
  categoryStats: Record<string, CategoryStats>;
  onSetCategory: (cat: string) => void;
}

const CategoryNav = memo(function CategoryNav({
  categories,
  activeCategory,
  categoryStats,
  onSetCategory,
}: CategoryNavProps) {
  return (
    <div
      data-tour="tour-category-nav"
      className="border-b border-gray-200 px-6 py-1.5 flex gap-1 overflow-x-auto flex-shrink-0 bg-gray-50/50 scrollbar-hide"
    >
      {['All', ...categories].map((cat) => {
        const isActive = activeCategory === cat;
        const catStat = categoryStats[cat];
        return (
          <button
            key={cat}
            onClick={() => onSetCategory(cat)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {cat}{' '}
            <span className={isActive ? 'text-blue-200' : 'text-gray-400'}>
              {catStat?.total || 0}
            </span>
            {catStat && catStat.total > 0 && (
              <span className={`ml-0.5 text-[8px] ${isActive ? 'text-blue-200' : 'text-gray-300'}`}>
                ({catStat.approved}/{catStat.total})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default CategoryNav;
