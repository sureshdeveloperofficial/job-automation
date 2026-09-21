import { Injectable } from '@nestjs/common';
import { ResumeTemplateStyle } from '@career-os/types';
import type { ResumeAST } from '@career-os/types';

@Injectable()
export class ResumeExportService {
  /**
   * Generates clean, parser-safe ATS semantic HTML
   */
  generateHtml(resume: ResumeAST, template: ResumeTemplateStyle = ResumeTemplateStyle.MODERN): string {
    const p = resume.personalInfo;
    const fontStack =
      template === 'CLASSIC'
        ? 'Georgia, Times, "Times New Roman", serif'
        : template === 'MINIMAL'
          ? '"Helvetica Neue", Arial, sans-serif'
          : 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

    const primaryColor = template === 'CLASSIC' ? '#111827' : '#0f172a';
    const accentColor = template === 'CLASSIC' ? '#1f2937' : '#2563eb';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${this.escape(p?.fullName || 'Resume')} - Resume</title>
  <style>
    @page { margin: 0.5in; size: letter portrait; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${fontStack};
      color: ${primaryColor};
      background: #ffffff;
      line-height: 1.45;
      font-size: 10pt;
      padding: 24px;
    }
    .header { text-align: center; border-bottom: 2px solid ${template === 'CLASSIC' ? '#000000' : '#e2e8f0'}; padding-bottom: 12px; margin-bottom: 16px; }
    h1 { font-size: 20pt; font-weight: 700; color: ${primaryColor}; margin-bottom: 4px; letter-spacing: -0.02em; }
    .headline { font-size: 11pt; color: #475569; font-weight: 500; margin-bottom: 6px; }
    .contact-line { font-size: 9pt; color: #64748b; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
    .contact-line a { color: inherit; text-decoration: none; }
    section { margin-bottom: 16px; }
    h2 {
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${accentColor};
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }
    .summary-text { font-size: 9.5pt; color: #334155; line-height: 1.5; text-align: justify; }
    .skills-grid { display: flex; flex-direction: column; gap: 4px; font-size: 9.5pt; }
    .skill-row { display: flex; }
    .skill-label { font-weight: 600; width: 140px; flex-shrink: 0; color: #1e293b; }
    .skill-values { color: #334155; }
    .exp-item { margin-bottom: 12px; page-break-inside: avoid; }
    .exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
    .exp-role { font-weight: 700; font-size: 10pt; color: #0f172a; }
    .exp-company { font-weight: 600; color: #475569; font-size: 9.5pt; }
    .exp-dates { font-size: 8.5pt; color: #64748b; font-weight: 500; }
    ul.bullets { list-style-type: disc; margin-left: 18px; margin-top: 4px; }
    ul.bullets li { font-size: 9.5pt; color: #334155; margin-bottom: 3px; line-height: 1.4; }
    .edu-item { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
    .edu-degree { font-weight: 600; color: #0f172a; }
    .edu-inst { color: #475569; font-size: 9.5pt; }
    @media print {
      body { padding: 0; }
      a { text-decoration: none; color: inherit; }
    }
  </style>
</head>
<body>
  <header class="header">
    <h1>${this.escape(p?.fullName || 'Candidate Name')}</h1>
    ${p?.headline ? `<div class="headline">${this.escape(p.headline)}</div>` : ''}
    <div class="contact-line">
      ${p?.email ? `<span>✉ ${this.escape(p.email)}</span>` : ''}
      ${p?.phone ? `<span>✆ ${this.escape(p.phone)}</span>` : ''}
      ${p?.location ? `<span>📍 ${this.escape(p.location)}</span>` : ''}
      ${p?.linkedinUrl ? `<span>🔗 LinkedIn</span>` : ''}
      ${p?.githubUrl ? `<span>🐙 GitHub</span>` : ''}
    </div>
  </header>

  ${
    resume.summary
      ? `<section>
    <h2>Professional Summary</h2>
    <p class="summary-text">${this.escape(resume.summary)}</p>
  </section>`
      : ''
  }

  <section>
    <h2>Technical Core Competencies</h2>
    <div class="skills-grid">
      ${
        resume.skills?.core?.length
          ? `<div class="skill-row"><span class="skill-label">Core Technologies:</span><span class="skill-values">${this.escape(resume.skills.core.join(', '))}</span></div>`
          : ''
      }
      ${
        resume.skills?.secondary?.length
          ? `<div class="skill-row"><span class="skill-label">Frameworks & Tools:</span><span class="skill-values">${this.escape(resume.skills.secondary.join(', '))}</span></div>`
          : ''
      }
      ${
        resume.skills?.tools?.length
          ? `<div class="skill-row"><span class="skill-label">Cloud & Platforms:</span><span class="skill-values">${this.escape(resume.skills.tools.join(', '))}</span></div>`
          : ''
      }
    </div>
  </section>

  <section>
    <h2>Professional Experience</h2>
    ${(resume.experiences || [])
      .map(
        (exp) => `
    <div class="exp-item">
      <div class="exp-header">
        <div>
          <span class="exp-role">${this.escape(exp.role)}</span>
          <span class="exp-company"> | ${this.escape(exp.company)}</span>
          ${exp.location ? `<span style="font-size: 8.5pt; color: #64748b;"> (${this.escape(exp.location)})</span>` : ''}
        </div>
        <span class="exp-dates">${this.escape(exp.startDate || '')} – ${exp.current ? 'Present' : this.escape(exp.endDate || '')}</span>
      </div>
      <ul class="bullets">
        ${(exp.bullets || [])
          .map((b) => `<li>${this.escape(typeof b === 'string' ? b : b.text)}</li>`)
          .join('')}
      </ul>
    </div>`,
      )
      .join('')}
  </section>

  ${
    (resume.education || []).length > 0
      ? `<section>
    <h2>Education</h2>
    ${resume.education
      .map(
        (edu) => `
    <div class="edu-item">
      <div>
        <span class="edu-degree">${this.escape(edu.degree || edu.field || 'Degree')}</span>
        <span class="edu-inst"> — ${this.escape(edu.institution)}</span>
      </div>
      <span class="exp-dates">${this.escape(edu.startDate || '')} – ${this.escape(edu.endDate || '')}</span>
    </div>`,
      )
      .join('')}
  </section>`
      : ''
  }
</body>
</html>`;
  }

  /**
   * Generates clean plain ASCII text for ATS copy-paste
   */
  generatePlainText(resume: ResumeAST): string {
    const lines: string[] = [];
    const p = resume.personalInfo;

    lines.push((p?.fullName || 'CANDIDATE NAME').toUpperCase());
    if (p?.headline) lines.push(p.headline);
    lines.push([p?.email, p?.phone, p?.location].filter(Boolean).join(' | '));
    if (p?.linkedinUrl || p?.githubUrl) {
      lines.push([p?.linkedinUrl, p?.githubUrl].filter(Boolean).join(' | '));
    }
    lines.push('\n' + '='.repeat(60) + '\n');

    if (resume.summary) {
      lines.push('PROFESSIONAL SUMMARY');
      lines.push('-'.repeat(30));
      lines.push(resume.summary);
      lines.push('\n');
    }

    if (resume.skills?.core?.length) {
      lines.push('CORE COMPETENCIES');
      lines.push('-'.repeat(30));
      lines.push(`Core: ${resume.skills.core.join(', ')}`);
      if (resume.skills.secondary?.length) {
        lines.push(`Secondary: ${resume.skills.secondary.join(', ')}`);
      }
      if (resume.skills.tools?.length) {
        lines.push(`Tools & Cloud: ${resume.skills.tools.join(', ')}`);
      }
      lines.push('\n');
    }

    if (resume.experiences?.length) {
      lines.push('PROFESSIONAL EXPERIENCE');
      lines.push('-'.repeat(30));
      for (const exp of resume.experiences) {
        const dates = `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}`;
        lines.push(`${exp.role} | ${exp.company} (${dates})`);
        for (const b of exp.bullets || []) {
          const text = typeof b === 'string' ? b : b.text;
          lines.push(`  * ${text}`);
        }
        lines.push('');
      }
    }

    if (resume.education?.length) {
      lines.push('EDUCATION');
      lines.push('-'.repeat(30));
      for (const edu of resume.education) {
        lines.push(`${edu.degree || edu.field || 'Degree'} - ${edu.institution} (${edu.startDate || ''} - ${edu.endDate || ''})`);
      }
      lines.push('\n');
    }

    return lines.join('\n');
  }

  private escape(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
