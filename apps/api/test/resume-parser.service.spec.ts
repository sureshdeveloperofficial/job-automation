import { describe, it, expect, beforeEach } from 'vitest';
import { ResumeParserService } from '../src/resume-parser/resume-parser.service.js';

describe('ResumeParserService', () => {
  let service: ResumeParserService;

  beforeEach(() => {
    service = new ResumeParserService();
  });

  const sampleResume = `
John Doe
Senior Software Engineer
john.doe@example.com | (555) 123-4567 | San Francisco, CA
https://linkedin.com/in/johndoe | https://github.com/johndoe

SUMMARY
Experienced backend engineer with 8 years of experience building high-throughput distributed systems in TypeScript, NestJS, and Go.

EXPERIENCE
Senior Backend Engineer | Acme Cloud Systems
Jan 2021 – Present
• Architected scalable microservices using NestJS, Redis, and PostgreSQL handling 25,000 req/sec.
• Engineered distributed queuing infrastructure with BullMQ and Docker, reducing latency by 40%.
• Mentored 5 junior engineers and led migration to Kubernetes on AWS.

Software Engineer | Beta Corp
Jan 2018 – Dec 2020
• Developed REST APIs in Node.js and PostgreSQL.
• Implemented automated CI/CD pipelines with GitHub Actions.

SKILLS
TypeScript, JavaScript, Python, Go, NestJS, React, PostgreSQL, Redis, Docker, Kubernetes, AWS, GraphQL, CI/CD, Git

EDUCATION
Bachelor of Science, University of California, Computer Science
2014 – 2018

PROJECTS
Career Automation Engine
Built an open-source platform utilizing Next.js and NestJS for automated career tracking.
`;

  it('should extract contact information accurately', () => {
    const result = service.parseText(sampleResume);

    expect(result.personalInfo.name).toBe('John Doe');
    expect(result.personalInfo.email).toBe('john.doe@example.com');
    expect(result.personalInfo.linkedinUrl).toContain('linkedin.com/in/johndoe');
    expect(result.personalInfo.githubUrl).toContain('github.com/johndoe');
  });

  it('should extract tech skills accurately from the dictionary', () => {
    const result = service.parseText(sampleResume);

    expect(result.skills).toContain('TypeScript');
    expect(result.skills).toContain('NestJS');
    expect(result.skills).toContain('PostgreSQL');
    expect(result.skills).toContain('Redis');
    expect(result.skills).toContain('Docker');
    expect(result.skills).toContain('Kubernetes');
    expect(result.skills).toContain('AWS');
  });

  it('should extract experiences with bullet points', () => {
    const result = service.parseText(sampleResume);

    expect(result.experiences.length).toBeGreaterThanOrEqual(1);
    const acme = result.experiences[0];
    expect(acme.company).toBe('Acme Cloud Systems');
    expect(acme.bullets).toBeDefined();
    expect(acme.bullets?.length).toBeGreaterThan(0);
  });

  it('should generate candidate evidence candidates from achievements and metrics', () => {
    const result = service.parseText(sampleResume);

    expect(result.suggestedEvidence.length).toBeGreaterThan(0);
    const metricEvidence = result.suggestedEvidence.find((e: any) =>
      e.claim.includes('25,000 req/sec') || e.claim.includes('40%')
    );
    expect(metricEvidence).toBeDefined();
    expect(metricEvidence?.confidenceScore).toBe(0.95);
  });

  it('should handle empty or whitespace text gracefully', () => {
    const result = service.parseText('   ');
    expect(result.skills).toEqual([]);
    expect(result.experiences).toEqual([]);
    expect(result.suggestedEvidence).toEqual([]);
  });
});
