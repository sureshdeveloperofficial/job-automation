import { describe, it, expect } from 'vitest';
import { JdAnalyzerService } from '../src/jd-analysis/jd-analyzer.service.js';
import { SeniorityLevel } from '@career-os/types';

describe('JdAnalyzerService', () => {
  const analyzer = new JdAnalyzerService();

  it('should detect seniority level from title and body accurately', () => {
    expect(analyzer.detectSeniority('Senior Backend Engineer', '')).toBe(SeniorityLevel.SENIOR);
    expect(analyzer.detectSeniority('Staff Software Engineer', '')).toBe(SeniorityLevel.STAFF);
    expect(analyzer.detectSeniority('Software Engineering Intern', '')).toBe(SeniorityLevel.INTERN);
    expect(analyzer.detectSeniority('Junior Frontend Developer', '')).toBe(SeniorityLevel.JUNIOR);
    expect(analyzer.detectSeniority('Backend Developer', 'Requires 7+ years of experience')).toBe(
      SeniorityLevel.SENIOR,
    );
  });

  it('should clean HTML formatting into clean text', () => {
    const raw = '<p>Hello <b>World</b>&amp; Team!</p><ul><li>Task 1</li><li>Task 2</li></ul>';
    const cleaned = analyzer.cleanHtml(raw);
    expect(cleaned).toContain('Hello World & Team!');
    expect(cleaned).toContain('• Task 1');
    expect(cleaned).toContain('• Task 2');
    expect(cleaned).not.toContain('<p>');
  });

  it('should separate required and preferred skills deterministically', () => {
    const text = `
      Required Qualifications:
      • Strong proficiency in TypeScript, React, and Node.js.
      • Deep knowledge of PostgreSQL and Redis.

      Preferred Skills:
      • Experience with Docker and Kubernetes.
      • Exposure to GraphQL.
    `;

    const { requiredSkills, preferredSkills } = analyzer.extractSkills(text);

    expect(requiredSkills).toContain('TypeScript');
    expect(requiredSkills).toContain('React');
    expect(requiredSkills).toContain('Node.js');
    expect(requiredSkills).toContain('PostgreSQL');
    expect(requiredSkills).toContain('Redis');

    expect(preferredSkills).toContain('Docker');
    expect(preferredSkills).toContain('Kubernetes');
    expect(preferredSkills).toContain('GraphQL');
  });

  it('should extract responsibility action bullets', () => {
    const text = `
      Key Responsibilities:
      • Architect and scale distributed microservices across global regions.
      • Partner with frontend teams to define typed REST and GraphQL APIs.
      • Maintain high test coverage with Vitest and Playwright.
    `;

    const bullets = analyzer.extractResponsibilities(text);
    expect(bullets.length).toBeGreaterThanOrEqual(2);
    expect(bullets[0]).toContain('Architect and scale distributed microservices');
  });
});
