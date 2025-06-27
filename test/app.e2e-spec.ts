import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import * as path from 'path';
import { describe, beforeEach, it, expect } from '@jest/globals';

const req = (request as any).default ? (request as any).default : request;

describe('AppController (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setBaseViewsDir(path.join(__dirname, '../views'));
    app.setViewEngine('ejs');
    await app.init();
  });

  it('/ (GET)', async () => {
    const res = await req(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('<title>웹접근성 검사기</title>');
  });
});
