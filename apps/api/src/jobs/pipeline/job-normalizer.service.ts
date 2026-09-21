import { Injectable } from '@nestjs/common';
import { SalaryInfo } from '@career-os/types';

@Injectable()
export class JobNormalizerService {
  /**
   * Cleans and canonicalizes varied job titles to a standardized format
   */
  normalizeTitle(rawTitle: string): string {
    if (!rawTitle) return '';

    // Strip bracketed text like [Remote], (Node.js & Distributed Systems), (f/m/d), etc.
    let cleaned = rawTitle
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .trim();

    // Standardize abbreviations
    cleaned = cleaned
      .replace(/\bsr\b\.?/gi, 'Senior')
      .replace(/\bjr\b\.?/gi, 'Junior')
      .replace(/\bengr\b\.?/gi, 'Engineer')
      .replace(/\bdev\b\.?/gi, 'Developer')
      .replace(/\bmgr\b\.?/gi, 'Manager')
      .replace(/\bsw\b/gi, 'Software')
      .replace(/\bswe\b/gi, 'Software Engineer');

    const lower = cleaned.toLowerCase();

    // Canonical role mapping
    if (/staff.*backend/i.test(lower)) return 'Staff Backend Engineer';
    if (/senior.*backend|backend.*senior/i.test(lower)) return 'Senior Backend Engineer';
    if (/staff.*frontend/i.test(lower)) return 'Staff Frontend Engineer';
    if (/senior.*frontend|frontend.*senior/i.test(lower)) return 'Senior Frontend Engineer';
    if (/staff.*full\s*stack/i.test(lower)) return 'Staff Full Stack Engineer';
    if (/senior.*full\s*stack|full\s*stack.*senior/i.test(lower)) return 'Senior Full Stack Engineer';
    if (/backend/i.test(lower) && /engineer|developer/i.test(lower)) return 'Backend Engineer';
    if (/frontend/i.test(lower) && /engineer|developer/i.test(lower)) return 'Frontend Engineer';
    if (/full\s*stack/i.test(lower) && /engineer|developer/i.test(lower)) return 'Full Stack Engineer';
    if (/sre|site\s*reliability/i.test(lower)) return 'Site Reliability Engineer';
    if (/devops/i.test(lower)) return 'DevOps Engineer';
    if (/data\s*engineer/i.test(lower)) return 'Data Engineer';
    if (/machine\s*learning|ml\s*engineer/i.test(lower)) return 'Machine Learning Engineer';
    if (/product\s*manager/i.test(lower)) return 'Product Manager';
    if (/engineering\s*manager/i.test(lower)) return 'Engineering Manager';

    cleaned = cleaned.replace(/[-|–].*$/, '').trim();
    if (/engineering\s*manager/i.test(lower)) return 'Engineering Manager';

    // Fallback: title-case the cleaned string
    return cleaned
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Deterministically parses salary text ranges across INR (LPA, ₹), USD ($), EUR (€), GBP (£)
   */
  parseSalary(text: string): SalaryInfo | null {
    if (!text) return null;

    // 1. Indian LPA patterns: e.g. "₹18 - ₹25 LPA", "22-34 LPA", "24 LPA"
    const lpaRange = /(?:₹|INR\s*)?(\d+(?:\.\d+)?)\s*(?:-|to)\s*(?:₹|INR\s*)?(\d+(?:\.\d+)?)\s*(?:LPA|lakhs?)/i.exec(text);
    if (lpaRange && lpaRange[1] && lpaRange[2]) {
      return {
        min: Math.round(parseFloat(lpaRange[1]) * 100000),
        max: Math.round(parseFloat(lpaRange[2]) * 100000),
        currency: 'INR',
        period: 'YEARLY',
      };
    }

    const singleLpa = /(?:₹|INR\s*)?(\d+(?:\.\d+)?)\s*(?:LPA|lakhs?)/i.exec(text);
    if (singleLpa && singleLpa[1]) {
      const val = Math.round(parseFloat(singleLpa[1]) * 100000);
      return {
        min: val,
        max: val,
        currency: 'INR',
        period: 'YEARLY',
      };
    }

    // 2. Direct INR numbers: e.g. "₹22,00,000 - ₹34,00,000"
    const inrRange = /₹\s*([\d,]+)\s*(?:-|to)\s*₹\s*([\d,]+)/.exec(text);
    if (inrRange && inrRange[1] && inrRange[2]) {
      const min = parseInt(inrRange[1].replace(/,/g, ''), 10);
      const max = parseInt(inrRange[2].replace(/,/g, ''), 10);
      if (!isNaN(min) && !isNaN(max)) {
        return { min, max, currency: 'INR', period: 'YEARLY' };
      }
    }

    // 3. USD $140,000 - $180,000 or $120k - $160k
    const usdKRange = /\$\s*(\d+)(?:\s*k)?\s*(?:-|to)\s*\$\s*(\d+)\s*k/i.exec(text);
    if (usdKRange && usdKRange[1] && usdKRange[2]) {
      return {
        min: parseInt(usdKRange[1], 10) * 1000,
        max: parseInt(usdKRange[2], 10) * 1000,
        currency: 'USD',
        period: 'YEARLY',
      };
    }

    const usdFullRange = /\$\s*([\d,]+)\s*(?:-|to)\s*\$\s*([\d,]+)/.exec(text);
    if (usdFullRange && usdFullRange[1] && usdFullRange[2]) {
      const min = parseInt(usdFullRange[1].replace(/,/g, ''), 10);
      const max = parseInt(usdFullRange[2].replace(/,/g, ''), 10);
      const isHourly = /hour|hr\b/i.test(text);
      return {
        min,
        max,
        currency: 'USD',
        period: isHourly ? 'HOURLY' : 'YEARLY',
      };
    }

    return null;
  }

  /**
   * Deterministically parses experience requirement strings into min and optional max years
   */
  parseExperience(text: string): { minYears: number; maxYears?: number } {
    if (!text) return { minYears: 0 };

    // "X - Y years" or "X to Y years"
    const rangeMatch = /(\d+)\s*(?:-|to)\s*(\d+)\s*(?:\+)?\s*(?:years?|yrs?)/i.exec(text);
    if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
      return {
        minYears: parseInt(rangeMatch[1], 10),
        maxYears: parseInt(rangeMatch[2], 10),
      };
    }

    // "X+ years" or "at least X years" or "minimum X years"
    const plusMatch = /(?:at\s+least|minimum|min)?\s*(\d+)\s*(?:\+)?\s*(?:years?|yrs?)/i.exec(text);
    if (plusMatch && plusMatch[1]) {
      return {
        minYears: parseInt(plusMatch[1], 10),
      };
    }

    return { minYears: 0 };
  }
}
