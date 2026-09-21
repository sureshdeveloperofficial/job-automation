import { Injectable } from '@nestjs/common';
import { SeniorityLevel } from '@career-os/types';
import { TECH_SKILLS_DICTIONARY } from '../resume-parser/resume-parser.service.js';

export interface JdAnalysisResult {
  seniority: SeniorityLevel;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  degrees: string[];
  cleanedText: string;
}

@Injectable()
export class JdAnalyzerService {
  /**
   * Main deterministic analysis pipeline for a raw or HTML job description
   */
  analyze(title: string, rawDescription: string): JdAnalysisResult {
    const cleanedText = this.cleanHtml(rawDescription);
    const seniority = this.detectSeniority(title, cleanedText);
    const { requiredSkills, preferredSkills } = this.extractSkills(cleanedText);
    const responsibilities = this.extractResponsibilities(cleanedText);
    const degrees = this.extractDegrees(cleanedText);

    return {
      seniority,
      requiredSkills,
      preferredSkills,
      responsibilities,
      degrees,
      cleanedText,
    };
  }

  /**
   * Cleans raw HTML / text down to readable plain text
   */
  cleanHtml(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Deterministically identifies role seniority from title and text
   */
  detectSeniority(title: string, body: string): SeniorityLevel {
    const titleLower = (title || '').toLowerCase();

    if (/\bintern\b|\binternship\b/i.test(titleLower)) return SeniorityLevel.INTERN;
    if (/\bentry\b|\bassociate\b|\bgraduate\b/i.test(titleLower)) return SeniorityLevel.ENTRY;
    if (/\bjr\.?\b|\bjunior\b/i.test(titleLower)) return SeniorityLevel.JUNIOR;
    if (/\bprincipal\b|\bdistinguished\b/i.test(titleLower)) return SeniorityLevel.PRINCIPAL;
    if (/\bstaff\b/i.test(titleLower)) return SeniorityLevel.STAFF;
    if (/\blead\b|\btech\s*lead\b/i.test(titleLower)) return SeniorityLevel.LEAD;
    if (/\bsr\.?\b|\bsenior\b/i.test(titleLower)) return SeniorityLevel.SENIOR;
    if (/\bdirector\b|\bhead\s*of\b|\bvp\b/i.test(titleLower)) return SeniorityLevel.EXECUTIVE;

    // Fallback checks on body text
    const bodyLower = (body || '').toLowerCase();
    if (/\b6\+\s*years|\b7\+\s*years|\b8\+\s*years|\b10\+\s*years/i.test(bodyLower)) {
      return SeniorityLevel.SENIOR;
    }
    if (/\b1\s*-\s*2\s*years|\b0\s*-\s*1\s*year|\bno\s*experience/i.test(bodyLower)) {
      return SeniorityLevel.JUNIOR;
    }

    return SeniorityLevel.MID;
  }

  /**
   * Extracts required vs preferred skills using the 500+ tech skills dictionary
   */
  extractSkills(text: string): {
    requiredSkills: string[];
    preferredSkills: string[];
  } {
    const lower = text.toLowerCase();

    // Partition text into Required vs Preferred sections if headers exist
    const prefSplit = lower.split(/(?:preferred\s*(?:skills|qualifications|requirements)|nice\s*to\s*have|bonus\s*points)/i);
    const requiredSection = prefSplit[0] ?? lower;
    const preferredSection = prefSplit[1] ?? '';

    const requiredSkillsSet = new Set<string>();
    const preferredSkillsSet = new Set<string>();

    for (const skill of TECH_SKILLS_DICTIONARY) {
      // Word boundary regex check
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');

      const formatted = this.formatSkillName(skill);

      if (preferredSection && regex.test(preferredSection)) {
        preferredSkillsSet.add(formatted);
      } else if (regex.test(requiredSection)) {
        requiredSkillsSet.add(formatted);
      }
    }

    // Ensure preferred skills don't duplicate required
    for (const req of requiredSkillsSet) {
      preferredSkillsSet.delete(req);
    }

    return {
      requiredSkills: Array.from(requiredSkillsSet).slice(0, 20),
      preferredSkills: Array.from(preferredSkillsSet).slice(0, 15),
    };
  }

  /**
   * Formats raw skill strings into clean capitalized labels
   */
  private formatSkillName(skill: string): string {
    const customMap: Record<string, string> = {
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'python': 'Python',
      'react': 'React',
      'next.js': 'Next.js',
      'node.js': 'Node.js',
      'nodejs': 'Node.js',
      'nestjs': 'NestJS',
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'redis': 'Redis',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'aws': 'AWS',
      'gcp': 'GCP',
      'azure': 'Azure',
      'graphql': 'GraphQL',
      'sql': 'SQL',
      'html': 'HTML5',
      'css': 'CSS3',
      'tailwind': 'Tailwind CSS',
      'tailwindcss': 'Tailwind CSS',
      'vitest': 'Vitest',
      'jest': 'Jest',
      'playwright': 'Playwright',
      'ci/cd': 'CI/CD',
      'kafka': 'Apache Kafka',
      'rabbitmq': 'RabbitMQ',
      'prisma': 'Prisma',
      'rest api': 'REST APIs',
    };

    if (customMap[skill.toLowerCase()]) {
      return customMap[skill.toLowerCase()];
    }

    return skill
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  /**
   * Extracts responsibility bullet points from text
   */
  extractResponsibilities(text: string): string[] {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const bullets: string[] = [];

    const actionVerbs = /^(?:architect|build|create|design|develop|engineer|implement|lead|maintain|manage|mentor|optimize|partner|collaborate|review|scale|ship|write|spearhead|deploy|monitor)\b/i;

    let inResponsibilitiesSection = false;

    for (const line of lines) {
      if (/responsibilities|what\s*you(?:'ll|\s*will)\s*do|the\s*role|your\s*impact/i.test(line)) {
        inResponsibilitiesSection = true;
        continue;
      }
      if (/requirements|qualifications|what\s*we(?:'re|\s*are)\s*looking\s*for|skills|compensation|about\s*us/i.test(line)) {
        inResponsibilitiesSection = false;
      }

      // Check if bullet point or starts with action verb
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+\.\s/.test(line);
      const cleanLine = line.replace(/^[•\-*\d.]+\s*/, '').trim();

      if (cleanLine.length > 20 && cleanLine.length < 300) {
        if ((inResponsibilitiesSection && isBullet) || (isBullet && actionVerbs.test(cleanLine))) {
          bullets.push(cleanLine);
        }
      }

      if (bullets.length >= 8) break;
    }

    return bullets;
  }

  /**
   * Extracts degrees and educational qualifications
   */
  extractDegrees(text: string): string[] {
    const degrees: string[] = [];
    const lower = text.toLowerCase();

    if (/\bbachelor(?:'s)?\b|\bb\.?tech\b|\bb\.?e\.?\b|\bbs\b/i.test(lower)) {
      degrees.push("Bachelor's Degree in Computer Science or related field");
    }
    if (/\bmaster(?:'s)?\b|\bm\.?tech\b|\bms\b/i.test(lower)) {
      degrees.push("Master's Degree in Computer Science or related field");
    }
    if (/\bphd\b|\bdoctorate\b/i.test(lower)) {
      degrees.push('Doctorate / Ph.D.');
    }

    return degrees;
  }
}
