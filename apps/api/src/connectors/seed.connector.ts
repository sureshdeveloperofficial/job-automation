import { Injectable } from '@nestjs/common';
import { ConnectorCapability, WorkMode, EmploymentType, SeniorityLevel } from '@career-os/types';
import { JobConnector, RawJobPayload, ConnectorFetchResult } from './connector.interface.js';

@Injectable()
export class SeedJobConnector extends JobConnector {
  readonly id = 'SEED';
  readonly name = 'Curated Tech Ecosystem Seed Connector';
  readonly capabilities = [
    ConnectorCapability.JOB_SEARCH,
    ConnectorCapability.JOB_DETAILS,
    ConnectorCapability.COMPANY_JOBS,
    ConnectorCapability.RAW_JD_CAPTURE,
  ];

  private readonly seedJobs: RawJobPayload[] = [
    {
      source: 'SEED',
      sourceJobId: 'seed-zoho-01',
      sourceUrl: 'https://www.zoho.com/careers/job-01',
      applicationUrl: 'https://www.zoho.com/careers/apply/seed-zoho-01',
      companyName: 'Zoho Corporation',
      title: 'Senior Backend Engineer (Node.js & Distributed Systems)',
      rawDescription: `
About Zoho Corporation:
Zoho is the operating system for business—a single online platform capable of running an entire business.

Role Overview:
We are seeking a seasoned Senior Backend Engineer to design and scale high-throughput distributed microservices.

Key Responsibilities:
• Architect, develop, and maintain high-volume distributed backend systems using Node.js, TypeScript, and Redis.
• Optimize PostgreSQL database queries, indexing strategies, and connection pooling for multi-tenant isolation.
• Partner with infrastructure teams to maintain 99.99% uptime SLA across global data centers.
• Conduct code reviews and mentor junior engineering team members.

Required Skills & Qualifications:
• 4+ years of professional backend engineering experience.
• Strong proficiency in TypeScript, Node.js, Express/NestJS, and SQL.
• Deep understanding of distributed transactions, event-driven systems (Kafka/RabbitMQ), and cache topologies (Redis).
• Bachelor's or Master's degree in Computer Science or equivalent practical experience.

Preferred Skills:
• Experience with pgvector or full-text search indexing.
• Familiarity with Docker, Kubernetes, and Linux systems administration.

Compensation:
₹22,00,000 - ₹34,00,000 per annum + employee benefits.
      `,
      location: 'Coimbatore, Tamil Nadu',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      country: 'India',
      latitude: 11.0168,
      longitude: 76.9558,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      seniority: SeniorityLevel.SENIOR,
      salaryMin: 2200000,
      salaryMax: 3400000,
      salaryCurrency: 'INR',
      salaryPeriod: 'YEARLY',
      postedAt: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
    },
    {
      source: 'SEED',
      sourceJobId: 'seed-razorpay-02',
      sourceUrl: 'https://razorpay.com/jobs/02',
      applicationUrl: 'https://razorpay.com/apply/seed-razorpay-02',
      companyName: 'Razorpay',
      title: 'Staff Full Stack Engineer (Fintech Core Platform)',
      rawDescription: `
About Razorpay:
Razorpay is India's leading fintech platform powering payments and banking for hundreds of thousands of businesses.

Role Overview:
Join the Core Payments team to build seamless merchant checkout experiences and fault-tolerant financial settlement engines.

Key Responsibilities:
• Lead technical design for merchant APIs handling 10,000+ financial transactions per second.
• Develop responsive, accessible web dashboards using React 19, Next.js, and Tailwind CSS.
• Establish zero-downtime database migration practices with PostgreSQL and Redis.
• Guarantee idempotent API execution and strict auditability for banking reconciliations.

Required Qualifications:
• 6+ years of full-stack software development experience.
• Mastery of React, Next.js, TypeScript, and Node.js or Go.
• Proven track record building high-reliability payment or transactional platforms.

Preferred Qualifications:
• Hands-on experience with PCI-DSS compliance and financial ledger architectures.
• Contributions to open-source developer tooling.

Compensation:
₹38,00,000 - ₹55,00,000 per annum + equity grants (ESOPs).
      `,
      location: 'Bangalore, Karnataka',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      latitude: 12.9716,
      longitude: 77.5946,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      seniority: SeniorityLevel.STAFF,
      salaryMin: 3800000,
      salaryMax: 5500000,
      salaryCurrency: 'INR',
      salaryPeriod: 'YEARLY',
      postedAt: new Date(Date.now() - 6 * 3600 * 1000), // 6 hours ago
    },
    {
      source: 'SEED',
      sourceJobId: 'seed-zerodha-03',
      sourceUrl: 'https://zerodha.tech/careers/03',
      applicationUrl: 'https://zerodha.tech/apply/seed-zerodha-03',
      companyName: 'Zerodha',
      title: 'Senior Systems & Site Reliability Engineer',
      rawDescription: `
About Zerodha:
Zerodha is the largest retail stockbroker in India, processing millions of orders every morning.

Role Overview:
We build minimalist, high-speed trading infrastructure with minimal bloat. We are looking for an SRE who loves raw Linux performance.

Key Responsibilities:
• Maintain and monitor bare-metal Linux infrastructure, HAProxy load balancers, and PostgreSQL clusters.
• Build automated telemetry and alert pipelines using Prometheus, Grafana, and OpenTelemetry.
• Implement automated failover protocols for sub-second disaster recovery.
• Debug kernel-level network latency bottlenecks.

Required Skills:
• 4+ years running high-scale Linux production systems.
• Deep understanding of TCP/IP, Linux networking, system calls, and eBPF.
• Fluency in Python, Bash, or Go for infrastructure automation.
• Experience managing large-scale PostgreSQL or ClickHouse deployments.

Compensation:
₹28,00,000 - ₹42,00,000 per annum.
      `,
      location: 'Bangalore, Karnataka',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      latitude: 12.9716,
      longitude: 77.5946,
      workMode: WorkMode.ONSITE,
      employmentType: EmploymentType.FULL_TIME,
      seniority: SeniorityLevel.SENIOR,
      salaryMin: 2800000,
      salaryMax: 4200000,
      salaryCurrency: 'INR',
      salaryPeriod: 'YEARLY',
      postedAt: new Date(Date.now() - 14 * 3600 * 1000), // 14 hours ago
    },
    {
      source: 'SEED',
      sourceJobId: 'seed-postman-04',
      sourceUrl: 'https://www.postman.com/careers/04',
      applicationUrl: 'https://www.postman.com/apply/seed-postman-04',
      companyName: 'Postman',
      title: 'Full Stack Engineer - Developer Experience & API Tools',
      rawDescription: `
About Postman:
Postman is used by over 30 million developers globally to design, test, and mock APIs.

Role Overview:
Help craft world-class developer experiences inside Postman's web and desktop applications.

Key Responsibilities:
• Build rich, interactive user interfaces for API test scripting, documentation generation, and mocking.
• Integrate complex client-side state models using TypeScript, React, and WebAssembly.
• Collaborate with API designers to evolve open specifications (OpenAPI, AsyncAPI).
• Optimize client bundle performance and rendering latency.

Required Skills:
• 3+ years experience with React, TypeScript, and modern JavaScript standards.
• Solid background in RESTful APIs, GraphQL, and WebSocket architectures.
• Passion for building intuitive developer tooling.

Preferred Skills:
• Experience with Electron or desktop application packaging.

Compensation:
₹24,00,000 - ₹36,00,000 per annum + RSU stock.
      `,
      location: 'Remote, India',
      city: 'Remote',
      state: 'Remote',
      country: 'India',
      workMode: WorkMode.REMOTE,
      employmentType: EmploymentType.FULL_TIME,
      seniority: SeniorityLevel.MID,
      salaryMin: 2400000,
      salaryMax: 3600000,
      salaryCurrency: 'INR',
      salaryPeriod: 'YEARLY',
      postedAt: new Date(Date.now() - 26 * 3600 * 1000), // 1 day ago
    },
    {
      source: 'SEED',
      sourceJobId: 'seed-browserstack-05',
      sourceUrl: 'https://www.browserstack.com/careers/05',
      applicationUrl: 'https://www.browserstack.com/apply/seed-browserstack-05',
      companyName: 'BrowserStack',
      title: 'Frontend Engineer (React 19, Design Systems)',
      rawDescription: `
About BrowserStack:
BrowserStack is the world's leading software testing platform powering 50,000+ customers.

Role Overview:
We are looking for a creative Frontend Engineer to build high-performance test automation reporting dashboards.

Key Responsibilities:
• Develop polished, accessible, and responsive user interfaces using Next.js, React, and Tailwind CSS.
• Build reusable UI components for our company-wide design system.
• Write comprehensive visual regression and Playwright end-to-end test suites.
• Profile and optimize browser rendering pipelines and animations.

Requirements:
• 2+ years of professional frontend web development.
• Expert knowledge of HTML5, CSS3, CSS variables, and modern responsive design.
• Strong TypeScript and React skills.

Compensation:
₹18,00,000 - ₹26,00,000 per annum.
      `,
      location: 'Chennai, Tamil Nadu',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      latitude: 13.0827,
      longitude: 80.2707,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      seniority: SeniorityLevel.MID,
      salaryMin: 1800000,
      salaryMax: 2600000,
      salaryCurrency: 'INR',
      salaryPeriod: 'YEARLY',
      postedAt: new Date(Date.now() - 48 * 3600 * 1000), // 2 days ago
    },
    {
      source: 'SEED',
      sourceJobId: 'seed-swiggy-06',
      sourceUrl: 'https://careers.swiggy.com/06',
      applicationUrl: 'https://careers.swiggy.com/apply/seed-swiggy-06',
      companyName: 'Swiggy',
      title: 'Backend Engineer - Real-Time Logistics Engine',
      rawDescription: `
About Swiggy:
Swiggy is India's leading on-demand convenience platform, delivering food, groceries, and dining experiences.

Role Overview:
Join the Logistics & Dispatching platform responsible for real-time order routing, geospatial dispatch, and driver assignment algorithms.

Key Responsibilities:
• Build low-latency microservices handling geo-hash queries and delivery partner route tracking.
• Process streaming event pipelines with Apache Kafka and Redis streams.
• Write clean, production-grade Go and Java / Node.js services.
• Ensure low latency (<25ms p99) under peak dinner order surges.

Required Qualifications:
• 2-5 years experience with backend systems design.
• Solid background in spatial algorithms, Redis, and relational databases.
• Strong problem-solving and algorithmic thinking.

Compensation:
₹20,00,000 - ₹32,00,000 per annum.
      `,
      location: 'Hyderabad, Telangana',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      latitude: 17.3850,
      longitude: 78.4867,
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      seniority: SeniorityLevel.MID,
      salaryMin: 2000000,
      salaryMax: 3200000,
      salaryCurrency: 'INR',
      salaryPeriod: 'YEARLY',
      postedAt: new Date(Date.now() - 72 * 3600 * 1000), // 3 days ago
    },
  ];

  async fetchJobs(options?: {
    companyIdentifier?: string;
    query?: string;
    limit?: number;
  }): Promise<ConnectorFetchResult> {
    let filtered = [...this.seedJobs];

    if (options?.companyIdentifier) {
      const match = options.companyIdentifier.toLowerCase();
      filtered = filtered.filter((j) => j.companyName.toLowerCase().includes(match));
    }

    if (options?.query) {
      const q = options.query.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.rawDescription.toLowerCase().includes(q) ||
          (j.location && j.location.toLowerCase().includes(q)),
      );
    }

    const limit = options?.limit ?? 50;
    const slice = filtered.slice(0, limit);

    return {
      jobs: slice,
      totalFetched: slice.length,
    };
  }
}
