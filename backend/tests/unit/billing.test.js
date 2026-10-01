import { describe, it, expect } from '@jest/globals';
import { computeBilling } from '../../src/services/billingService.js';
import { OFFER_TYPE } from '../../src/constants/index.js';

describe('Billing Engine', () => {
  const mockService = {
    name: 'Facial Deluxe',
    price: 1000,
    taxRate: 0.18, // 18% GST
  };

  it('computes subtotal, 18% tax, and total with no offer applied', () => {
    const result = computeBilling(mockService, null);
    expect(result.subtotal).toBe(1000);
    expect(result.discountAmount).toBe(0);
    expect(result.taxAmount).toBe(180);
    expect(result.totalAmount).toBe(1180);
  });

  it('computes percentage offer with max discount cap', () => {
    const offer = {
      type: OFFER_TYPE.PERCENTAGE,
      value: 50, // 50%
      maxDiscountAmount: 200, // Capped at ₹200
    };

    const result = computeBilling(mockService, offer);
    // 50% of 1000 is 500, but cap is 200
    expect(result.discountAmount).toBe(200);
    const taxable = 800;
    expect(result.taxAmount).toBe(Math.round(taxable * 0.18 * 100) / 100);
    expect(result.totalAmount).toBe(taxable + result.taxAmount);
  });

  it('computes flat offer discount correctly', () => {
    const offer = {
      type: OFFER_TYPE.FLAT,
      value: 150,
    };

    const result = computeBilling(mockService, offer);
    expect(result.discountAmount).toBe(150);
    const taxable = 850;
    expect(result.taxAmount).toBe(Math.round(taxable * 0.18 * 100) / 100);
    expect(result.totalAmount).toBe(taxable + result.taxAmount);
  });
});
