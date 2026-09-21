import { describe, it, expect, beforeEach } from 'vitest';
import { AtsScorerService } from '../src/resumes/ats-scorer/ats-scorer.service.js';
import type { ResumeAST } from '@career-os/types';

describe('AtsScorerService', () => {
  let service: AtsScorerService;

  const mockResume: ResumeAST = {
    personalInfo: {
      fullName: 'Suresh Kumar',
      headline: 'Senior Backend Engineer',
      email: 'suresh@example.com',
      phone: '+91 9876543210',
      location: 'Coimbatore, India',
      linkedinUrl: 'https://linkedin.com/in/suresh',
      githubUrl: 'https://github.com/suresh',
    },
    summary:
      'Senior Backend Engineer with 6+ years of experience designing scalable distributed microservices, streaming pipelines, and fault-tolerant cloud systems.',
    skills: {
      core: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker'],
      secondary: ['Kubernetes', 'RabbitMQ', 'GraphQL'],
      tools: ['Git', 'Jest', 'Linux'],
    },
    experiences: [
      {
        company: 'TechCorp Solutions',
        role: 'Senior Backend Engineer',
        location: 'Bangalore, India',
        startDate: '2021',
        endDate: '2026',
        current: true,
        bullets: [
          {
            text: 'Architected event-driven microservices reducing API latency by 45% for 2.5M daily active users.',
            metrics: ['45%', '2.5M'],
            matchedSkills: ['Node.js', 'PostgreSQL'],
          },
          {
            text: 'Engineered Redis caching layer saving $120k annually in database compute expenditures.',
            metrics: ['$120k'],
            matchedSkills: ['Redis'],
          },
          {
            text: 'Mentored 5 junior engineers and established automated CI/CD pipeline achieving 99.9% deployment reliability.',
            metrics: ['5', '99.9%'],
            matchedSkills: ['Docker'],
          },
        ],
      },
      {
        company: 'Innovate Labs',
        role: 'Software Engineer',
        location: 'Coimbatore, India',
        startDate: '2019',
        endDate: '2021',
        current: false,
        bullets: [
          {
            text: 'Constructed RESTful APIs with Node.js and PostgreSQL serving 10,000+ requests per minute.',
            metrics: ['10,000+'],
            matchedSkills: ['Node.js', 'PostgreSQL'],
          },
        ],
      },
    ],
    education: [
      {
        institution: 'PSG College of Technology',
        degree: 'B.Tech in Information Technology',
        startDate: '2015',
        endDate: '2019',
      },
    ],
  };

  beforeEach(() => {
    service = new AtsScorerService();
  });

  it('should score high for a well-matched senior backend role with metrics', () => {
    const targetJob = {
      title: 'Senior Backend Engineer',
      companyName: 'Razorpay',
      requiredSkills: ['Node.js', 'PostgreSQL', 'TypeScript', 'Docker'],
      preferredSkills: ['Redis', 'Kubernetes'],
      seniority: 'SENIOR',
      experienceMinYears: 4,
    };

    const result = service.evaluate(mockResume, targetJob);

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.breakdown.requiredSkills.score).toBe(100);
    expect(result.breakdown.requiredSkills.matched).toEqual(
      expect.arrayContaining(['Node.js', 'PostgreSQL', 'TypeScript', 'Docker']),
    );
    expect(result.breakdown.quantifiableImpact.quantifiedBulletCount).toBe(4);
    expect(result.breakdown.formattingHygiene.hasContactInfo).toBe(true);
  });

  it('should resolve tech synonyms (e.g. Postgres -> PostgreSQL, AWS -> Amazon Web Services)', () => {
    const targetJob = {
      title: 'Backend Engineer',
      requiredSkills: ['Postgres', 'Node', 'Containers'],
      preferredSkills: ['K8s'],
    };

    const result = service.evaluate(mockResume, targetJob);

    expect(result.breakdown.requiredSkills.matched).toContain('Postgres');
    expect(result.breakdown.requiredSkills.matched).toContain('Node');
    expect(result.breakdown.preferredSkills.matched).toContain('K8s');
  });

  it('should identify skill gaps and generate actionable recommendations', () => {
    const targetJob = {
      title: 'Python Data Platform Lead',
      requiredSkills: ['Python', 'Apache Spark', 'Kafka', 'PostgreSQL'],
      preferredSkills: ['Snowflake', 'Airflow'],
      seniority: 'LEAD',
      experienceMinYears: 8,
    };

    const result = service.evaluate(mockResume, targetJob);

    expect(result.score).toBeLessThan(70);
    expect(result.breakdown.requiredSkills.missing).toEqual(
      expect.arrayContaining(['Python', 'Apache Spark', 'Kafka']),
    );
    expect(result.breakdown.recommendations.length).toBeGreaterThan(0);
    expect(result.breakdown.recommendations.some((r) => r.includes('Python'))).toBe(true);
  });

  it('should evaluate impact metrics accurately across various formatting tokens', () => {
    expect(service.isBulletQuantified('Improved performance by 35% across all endpoints')).toBe(true);
    expect(service.isBulletQuantified('Reduced costs by $45,000 per month')).toBe(true);
    expect(service.isBulletQuantified('Scaled backend to 3x throughput')).toBe(true);
    expect(service.isBulletQuantified('Cut API response latency to 12ms')).toBe(true);
    expect(service.isBulletQuantified('Wrote backend code and fixed tickets')).toBe(false);
  });
});
