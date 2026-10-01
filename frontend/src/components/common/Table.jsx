import React from 'react';

export function Table({ headers = [], children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-soft ${className}`}>
      <table className="w-full text-left text-sm text-stone-600">
        <thead className="bg-stone-50/80 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-5 py-3.5 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">{children}</tbody>
      </table>
    </div>
  );
}

export default React.memo(Table);
