import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthModule } from '../src/health/health.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('HealthController (Integration)', () => {
  let app: INestApplication;
  const mockPrismaService = {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET) should report healthy when DB is connected', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(res.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      services: {
        database: 'healthy',
        api: 'healthy',
      },
    });
  });

  it('/health (GET) should report degraded when DB query fails', async () => {
    mockPrismaService.$queryRaw.mockRejectedValueOnce(new Error('DB unreachable'));

    const res = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(res.body.status).toBe('degraded');
    expect(res.body.services.database).toBe('unhealthy');
  });

  afterAll(async () => {
    await app.close();
  });
});
