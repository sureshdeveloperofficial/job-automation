import { describe, it, expect } from 'vitest';
import { JobNormalizerService } from '../src/jobs/pipeline/job-normalizer.service.js';

describe('JobNormalizerService', () => {
  const normalizer = new JobNormalizerService();

  describe('normalizeTitle', () => {
    it('should canonicalize senior backend engineer variations', () => {
      expect(normalizer.normalizeTitle('Sr. Software Engr - Backend')).toBe('Senior Backend Engineer');
      expect(normalizer.normalizeTitle('Senior Backend Developer [Remote]')).toBe('Senior Backend Engineer');
      expect(normalizer.normalizeTitle('Staff Backend Engineer (Core Platform)')).toBe('Staff Backend Engineer');
    });

    it('should canonicalize full stack engineer variations', () => {
      expect(normalizer.normalizeTitle('Fullstack Developer (React/Node)')).toBe('Full Stack Engineer');
      expect(normalizer.normalizeTitle('Sr Full Stack Eng')).toBe('Senior Full Stack Engineer');
    });

    it('should canonicalize SRE and DevOps variations', () => {
      expect(normalizer.normalizeTitle('Site Reliability Engineer (SRE)')).toBe('Site Reliability Engineer');
      expect(normalizer.normalizeTitle('DevOps Engineer - Infrastructure')).toBe('DevOps Engineer');
    });
  });

  describe('parseSalary', () => {
    it('should parse Indian LPA salary ranges accurately', () => {
      const result = normalizer.parseSalary('Compensation: ₹18 - ₹28 LPA + benefits');
      expect(result).not.toBeNull();
      expect(result?.min).toBe(1800000);
      expect(result?.max).toBe(2800000);
      expect(result?.currency).toBe('INR');
      expect(result?.period).toBe('YEARLY');
    });

    it('should parse raw Indian rupee values', () => {
      const result = normalizer.parseSalary('Salary: ₹22,00,000 - ₹34,00,000');
      expect(result).not.toBeNull();
      expect(result?.min).toBe(2200000);
      expect(result?.max).toBe(3400000);
      expect(result?.currency).toBe('INR');
    });

    it('should parse USD annual salary ranges', () => {
      const result = normalizer.parseSalary('Pay range: $140k - $180k per year');
      expect(result).not.toBeNull();
      expect(result?.min).toBe(140000);
      expect(result?.max).toBe(180000);
      expect(result?.currency).toBe('USD');
    });
  });

  describe('parseExperience', () => {
    it('should extract experience ranges', () => {
      expect(normalizer.parseExperience('Requires 3-5 years of experience')).toEqual({
        minYears: 3,
        maxYears: 5,
      });
      expect(normalizer.parseExperience('Must have 4+ years in software engineering')).toEqual({
        minYears: 4,
      });
    });

    it('should fallback cleanly when no experience mentioned', () => {
      expect(normalizer.parseExperience('No specific requirement')).toEqual({ minYears: 0 });
    });
  });
});
