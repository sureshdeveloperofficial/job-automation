import { Injectable, Logger } from '@nestjs/common';
import { ParsedResumeData, CandidateExperienceItem, CandidateEducationItem, CandidateProjectItem } from '@career-os/types';

// Curated tech vocabulary covering modern software engineering, data, devops, and cloud
const TECH_SKILLS_DICTIONARY = [
  // Languages
  'typescript', 'javascript', 'python', 'java', 'go', 'golang', 'rust', 'c++', 'c#', 'c',
  'ruby', 'php', 'swift', 'kotlin', 'scala', 'elixir', 'dart', 'shell', 'bash', 'powershell',
  'sql', 'nosql', 'graphql', 'html', 'css', 'sass', 'less',
  
  // Frontend
  'react', 'react.js', 'next.js', 'vue', 'vue.js', 'nuxt', 'angular', 'svelte', 'sveltekit',
  'tailwind', 'tailwindcss', 'bootstrap', 'material-ui', 'shadcn', 'radix-ui', 'redux',
  'zustand', 'mobx', 'tanstack query', 'react query', 'webpack', 'vite', 'esbuild',
  
  // Backend & Frameworks
  'node.js', 'nodejs', 'nestjs', 'express', 'express.js', 'fastify', 'koa', 'django',
  'flask', 'fastapi', 'spring boot', 'spring', 'asp.net', '.net core', 'ruby on rails',
  'laravel', 'trpc', 'rest api', 'restful', 'grpc', 'websockets', 'socket.io',
  
  // Databases & Caching
  'postgresql', 'postgres', 'mysql', 'mariadb', 'sqlite', 'mongodb', 'redis', 'elasticsearch',
  'cassandra', 'dynamodb', 'couchdb', 'neo4j', 'prisma', 'typeorm', 'drizzle', 'mongoose',
  'clickhouse', 'snowflake', 'bigquery',
  
  // DevOps, Cloud & Infra
  'docker', 'kubernetes', 'k8s', 'helm', 'terraform', 'ansible', 'aws', 'amazon web services',
  'ec2', 's3', 'rds', 'lambda', 'ecs', 'eks', 'cloudwatch', 'gcp', 'google cloud',
  'azure', 'ci/cd', 'github actions', 'gitlab ci', 'jenkins', 'circleci', 'nginx', 'apache',
  'linux', 'ubuntu', 'prometheus', 'grafana', 'datadog', 'sentry', 'opentelemetry',
  
  // Messaging & Queues
  'bullmq', 'kafka', 'rabbitmq', 'sqs', 'sns', 'eventbridge', 'pub/sub',
  
  // Architecture & Concepts
  'microservices', 'event-driven architecture', 'domain-driven design', 'serverless',
  'system design', 'distributed systems', 'unit testing', 'integration testing', 'e2e testing',
  'jest', 'vitest', 'playwright', 'cypress', 'supertest', 'git', 'agile', 'scrum'
];

@Injectable()
export class ResumeParserService {
  private readonly logger = new Logger(ResumeParserService.name);

  /**
   * Deterministically parses resume plain text into structured candidate data
   * and generates candidate evidence items without an LLM.
   */
  public parseText(rawText: string): ParsedResumeData {
    if (!rawText || rawText.trim().length === 0) {
      return this.emptyResult();
    }

    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const personalInfo = this.extractPersonalInfo(lines, rawText);
    const sections = this.segmentSections(lines);
    const skills = this.extractSkills(rawText, sections['SKILLS'] || []);
    const experiences = this.extractExperiences(sections['EXPERIENCE'] || []);
    const education = this.extractEducation(sections['EDUCATION'] || []);
    const projects = this.extractProjects(sections['PROJECTS'] || []);
    const certifications = this.extractCertifications(sections['CERTIFICATIONS'] || []);
    const suggestedEvidence = this.generateEvidence(skills, experiences, projects);

    return {
      personalInfo: {
        ...personalInfo,
        summary: sections['SUMMARY'] ? sections['SUMMARY'].join(' ') : personalInfo.summary,
      },
      skills,
      experiences,
      education,
      projects,
      certifications,
      suggestedEvidence,
      rawText,
    };
  }

  private extractPersonalInfo(lines: string[], text: string) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
    const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})\b|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i;
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i;
    const portfolioRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:dev|io|me|tech|com|org))(?:\/[^\s]*)?/i;

    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);
    const linkedinMatch = text.match(linkedinRegex);
    const githubMatch = text.match(githubRegex);
    const portfolioMatch = text.match(portfolioRegex);

    // Heuristic for Candidate Name: First 1-3 lines before contact details that are short
    let candidateName = '';
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      if (
        !line.includes('@') &&
        !line.includes('http') &&
        !line.match(/\d{3}/) &&
        line.length > 2 &&
        line.length < 50 &&
        !this.isHeading(line)
      ) {
        candidateName = line;
        break;
      }
    }

    return {
      name: candidateName || undefined,
      email: emailMatch ? emailMatch[0] : undefined,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      linkedinUrl: linkedinMatch ? linkedinMatch[0] : undefined,
      githubUrl: githubMatch ? githubMatch[0] : undefined,
      portfolioUrl: portfolioMatch ? portfolioMatch[0] : undefined,
      location: this.extractLocation(lines),
      summary: undefined,
    };
  }

  private isHeading(line: string): boolean {
    const upper = line.toUpperCase().replace(/[^A-Z\s]/g, '').trim();
    const headers = [
      'SUMMARY', 'PROFESSIONAL SUMMARY', 'ABOUT ME', 'OBJECTIVE',
      'EXPERIENCE', 'WORK EXPERIENCE', 'EMPLOYMENT HISTORY', 'WORK HISTORY',
      'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'TECHNOLOGIES',
      'EDUCATION', 'ACADEMIC BACKGROUND', 'QUALIFICATIONS',
      'PROJECTS', 'PERSONAL PROJECTS', 'KEY PROJECTS',
      'CERTIFICATIONS', 'LICENSES', 'AWARDS',
    ];
    return headers.includes(upper);
  }

  private segmentSections(lines: string[]): Record<string, string[]> {
    const sections: Record<string, string[]> = {};
    let currentSection = 'HEADER';

    const headerMap: Record<string, string> = {
      SUMMARY: 'SUMMARY',
      'PROFESSIONAL SUMMARY': 'SUMMARY',
      'ABOUT ME': 'SUMMARY',
      OBJECTIVE: 'SUMMARY',
      EXPERIENCE: 'EXPERIENCE',
      'WORK EXPERIENCE': 'EXPERIENCE',
      'EMPLOYMENT HISTORY': 'EXPERIENCE',
      'WORK HISTORY': 'EXPERIENCE',
      'PROFESSIONAL EXPERIENCE': 'EXPERIENCE',
      SKILLS: 'SKILLS',
      'TECHNICAL SKILLS': 'SKILLS',
      'CORE COMPETENCIES': 'SKILLS',
      TECHNOLOGIES: 'SKILLS',
      EDUCATION: 'EDUCATION',
      'ACADEMIC BACKGROUND': 'EDUCATION',
      QUALIFICATIONS: 'EDUCATION',
      PROJECTS: 'PROJECTS',
      'PERSONAL PROJECTS': 'PROJECTS',
      'KEY PROJECTS': 'PROJECTS',
      CERTIFICATIONS: 'CERTIFICATIONS',
      LICENSES: 'CERTIFICATIONS',
    };

    for (const line of lines) {
      const cleanLine = line.toUpperCase().replace(/[^A-Z\s]/g, '').trim();
      if (headerMap[cleanLine]) {
        currentSection = headerMap[cleanLine];
        if (!sections[currentSection]) {
          sections[currentSection] = [];
        }
        continue;
      }

      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push(line);
    }

    return sections;
  }

  private extractSkills(rawText: string, skillLines: string[]): string[] {
    const found = new Set<string>();
    const textToSearch = (skillLines.join(' ') + ' ' + rawText).toLowerCase();

    for (const skill of TECH_SKILLS_DICTIONARY) {
      // Word boundary regex check
      const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'i');
      if (regex.test(textToSearch)) {
        // Format neatly (capitalize standard names)
        found.add(this.formatSkillName(skill));
      }
    }

    return Array.from(found);
  }

  private formatSkillName(raw: string): string {
    const special: Record<string, string> = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      nodejs: 'Node.js',
      'node.js': 'Node.js',
      nestjs: 'NestJS',
      react: 'React',
      'react.js': 'React',
      'next.js': 'Next.js',
      vue: 'Vue.js',
      'vue.js': 'Vue.js',
      postgresql: 'PostgreSQL',
      postgres: 'PostgreSQL',
      mongodb: 'MongoDB',
      mysql: 'MySQL',
      redis: 'Redis',
      docker: 'Docker',
      kubernetes: 'Kubernetes',
      aws: 'AWS',
      gcp: 'GCP',
      graphql: 'GraphQL',
      github: 'GitHub',
      bullmq: 'BullMQ',
      ci: 'CI/CD',
      'ci/cd': 'CI/CD',
      vitest: 'Vitest',
      jest: 'Jest',
      playwright: 'Playwright',
    };
    return special[raw.toLowerCase()] || raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  private extractLocation(lines: string[]): string | undefined {
    const locationRegex = /\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/;
    for (let i = 0; i < Math.min(lines.length, 6); i++) {
      const match = lines[i].match(locationRegex);
      if (match && !lines[i].includes('@') && !lines[i].includes('http')) {
        return match[0].trim();
      }
    }
    return undefined;
  }

  private extractExperiences(lines: string[]): CandidateExperienceItem[] {
    const items: CandidateExperienceItem[] = [];
    let current: Partial<CandidateExperienceItem> | null = null;

    const dateRangeRegex = /(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*(?:–|-|to)\s*(?:Present|(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4})/i;

    for (const line of lines) {
      const hasDate = dateRangeRegex.test(line);

      // If current experience exists but has no date yet, and this line is the date line:
      if (current && !current.startDate && hasDate) {
        const dateMatch = line.match(dateRangeRegex);
        if (dateMatch) {
          const parts = dateMatch[0].split(/(?:–|-|to)/);
          current.startDate = parts[0]?.trim();
          current.endDate = parts[1]?.trim();
          current.isCurrent = /present/i.test(dateMatch[0]);
        }
        continue;
      }

      // Check if line looks like a title/company header line (e.g. "Title | Company" or "Title at Company")
      const isHeaderLine = line.includes('|') || /\bat\b/i.test(line);
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');

      if ((hasDate || isHeaderLine) && !isBullet) {
        if (current && (current.title || current.company)) {
          items.push({
            title: current.title || 'Software Engineer',
            company: current.company || 'Enterprise',
            location: current.location,
            startDate: current.startDate,
            endDate: current.endDate,
            isCurrent: current.isCurrent ?? false,
            description: current.bullets ? current.bullets.join('\n') : undefined,
            bullets: current.bullets || [],
          });
        }

        const dateMatch = line.match(dateRangeRegex);
        let title = 'Software Engineer';
        let company = 'Enterprise';

        if (line.includes('|')) {
          const parts = line.split('|').map((p) => p.trim());
          title = parts[0] || title;
          company = parts[1] || company;
        } else if (/\bat\b/i.test(line)) {
          const parts = line.split(/\bat\b/i).map((p) => p.trim());
          title = parts[0] || title;
          company = parts[1] || company;
        } else {
          title = line.replace(dateRangeRegex, '').trim() || title;
        }

        current = {
          title,
          company,
          startDate: dateMatch ? dateMatch[0].split(/(?:–|-|to)/)[0].trim() : undefined,
          endDate: dateMatch ? dateMatch[0].split(/(?:–|-|to)/)[1]?.trim() : undefined,
          isCurrent: dateMatch ? /present/i.test(dateMatch[0]) : false,
          bullets: [],
        };
      } else if (current) {
        const cleanBullet = line.replace(/^[•\-*]\s*/, '').trim();
        if (cleanBullet) {
          if (!current.bullets) current.bullets = [];
          current.bullets.push(cleanBullet);
        }
      }
    }

    if (current && (current.title || current.company)) {
      items.push({
        title: current.title || 'Software Engineer',
        company: current.company || 'Enterprise',
        location: current.location,
        startDate: current.startDate,
        endDate: current.endDate,
        isCurrent: current.isCurrent ?? false,
        description: current.bullets ? current.bullets.join('\n') : undefined,
        bullets: current.bullets || [],
      });
    }

    return items;
  }

  private extractEducation(lines: string[]): CandidateEducationItem[] {
    const items: CandidateEducationItem[] = [];
    const degreeKeywords = ['bachelor', 'master', 'phd', 'b.s.', 'm.s.', 'b.tech', 'm.tech', 'associate', 'degree'];

    for (const line of lines) {
      const lower = line.toLowerCase();
      const hasDegree = degreeKeywords.some((k) => lower.includes(k));
      if (hasDegree || line.includes('University') || line.includes('College') || line.includes('Institute')) {
        const parts = line.split(/[,|•]/).map((p) => p.trim());
        items.push({
          degree: parts[0] || 'Bachelor of Science',
          institution: parts[1] || parts[0] || 'University',
          fieldOfStudy: parts.length > 2 ? parts[2] : 'Computer Science',
        });
      }
    }

    return items;
  }

  private extractProjects(lines: string[]): CandidateProjectItem[] {
    const projects: CandidateProjectItem[] = [];
    let current: Partial<CandidateProjectItem> | null = null;

    for (const line of lines) {
      if (!line.startsWith('•') && !line.startsWith('-') && line.length < 80) {
        if (current && current.name) {
          projects.push(current as CandidateProjectItem);
        }
        current = {
          name: line.replace(/[|•].*$/, '').trim(),
          description: '',
          technologies: [],
        };
      } else if (current) {
        const bullet = line.replace(/^[•\-*]\s*/, '').trim();
        current.description = current.description ? `${current.description} ${bullet}` : bullet;
      }
    }

    if (current && current.name) {
      projects.push(current as CandidateProjectItem);
    }

    return projects;
  }

  private extractCertifications(lines: string[]): string[] {
    return lines
      .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
      .filter((l) => l.length > 3 && l.length < 150);
  }

  private generateEvidence(
    skills: string[],
    experiences: CandidateExperienceItem[],
    projects: CandidateProjectItem[]
  ): ParsedResumeData['suggestedEvidence'] {
    const evidence: ParsedResumeData['suggestedEvidence'] = [];

    // Extract evidence claims from experience bullets
    for (const exp of experiences) {
      if (!exp.bullets) continue;
      for (const bullet of exp.bullets) {
        // If bullet contains quantified metrics or strong action verbs
        const hasMetrics = /\d+[%kKmM]?|\$\d+/.test(bullet);
        const actionVerbMatch = /^(?:engineered|architected|built|developed|designed|implemented|optimized|scaled|led|created|automated|reduced|increased)\b/i.test(bullet);

        if (hasMetrics || actionVerbMatch || bullet.length > 40) {
          evidence.push({
            category: 'TECHNICAL',
            claim: bullet,
            context: `${exp.title} at ${exp.company}`,
            sourceDetail: 'Resume Import',
            confidenceScore: hasMetrics ? 0.95 : 0.85,
          });
        }
      }
    }

    // Add high-confidence project evidence
    for (const proj of projects) {
      if (proj.description && proj.description.length > 20) {
        evidence.push({
          category: 'PROJECT',
          claim: `${proj.name}: ${proj.description}`,
          context: 'Personal / Professional Project',
          sourceDetail: 'Resume Projects',
          confidenceScore: 0.9,
        });
      }
    }

    // Add direct skills evidence if list is not empty
    for (const skill of skills.slice(0, 10)) {
      evidence.push({
        category: 'SKILL',
        claim: `Demonstrated technical competency in ${skill}`,
        context: 'Verified via Resume Keyword Extraction',
        sourceDetail: 'Resume Skills Section',
        confidenceScore: 0.8,
      });
    }

    return evidence;
  }

  private emptyResult(): ParsedResumeData {
    return {
      personalInfo: {},
      skills: [],
      experiences: [],
      education: [],
      projects: [],
      certifications: [],
      suggestedEvidence: [],
      rawText: '',
    };
  }
}
