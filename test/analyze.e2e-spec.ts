import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import {
  describe,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  it,
  expect,
} from '@jest/globals';

const req = (request as any).default ? (request as any).default : request;

describe('Analyze Endpoint (e2e)', () => {
  let app: NestExpressApplication;
  let localServer: http.Server;
  let localServerUrl: string;

  beforeAll(async () => {
    // 로컬 서버를 띄워서 case1.html 제공
    const htmlPath = path.join(__dirname, 'html', 'case1.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    localServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlContent);
    });

    return new Promise<void>((resolve) => {
      localServer.listen(0, () => {
        const address = localServer.address();
        if (address && typeof address === 'object') {
          localServerUrl = `http://localhost:${address.port}`;
        }
        resolve();
      });
    });
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setBaseViewsDir(path.join(__dirname, '../views'));
    app.setViewEngine('ejs');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    if (localServer) {
      await new Promise<void>((resolve) => {
        localServer.close(() => resolve());
      });
    }
  });

  it('should analyze case1.html and return accessibility check results', async () => {
    const response = await req(app.getHttpServer())
      .get('/analyze')
      .query({ url: localServerUrl })
      .expect(200);

    const html = response.text;
    const $ = cheerio.load(html);

    // HTML에 웹접근성 분석 결과가 포함되어 있는지 확인
    expect(html).toContain('웹접근성 분석 결과');
    expect(html).toContain('URL:');
    expect(html).toContain(localServerUrl);

    // 1. 대체 텍스트 (img) 검증
    const imageNavItem = $('.nav-item').filter((_, el) => 
      $(el).text().includes('대체 텍스트 (img)')
    );
    expect(imageNavItem.length).toBeGreaterThan(0);
    
    const imageText = imageNavItem.text();
    const imageMatch = imageText.match(/대체 텍스트 \(img\) - (\d+) \/ (\d+)/);
    expect(imageMatch).toBeDefined();
    const validImages = parseInt(imageMatch![1]);
    const totalImages = parseInt(imageMatch![2]);
    expect(totalImages).toBeGreaterThan(0);
    expect(validImages).toBeGreaterThan(0);
    expect(validImages).toBeLessThanOrEqual(totalImages);

    // 2. 건너뛰기 링크 검증
    const skipNavItem = $('.nav-item').filter((_, el) => 
      $(el).text().includes('건너뛰기 링크')
    );
    expect(skipNavItem.length).toBeGreaterThan(0);
    
    const skipNavText = skipNavItem.text();
    const skipNavMatch = skipNavText.match(/건너뛰기 링크 - (\d+) \/ (\d+)/);
    expect(skipNavMatch).toBeDefined();
    const validSkipNavs = parseInt(skipNavMatch![1]);
    const totalSkipNavs = parseInt(skipNavMatch![2]);
    expect(totalSkipNavs).toBeGreaterThan(0);
    expect(validSkipNavs).toBeGreaterThan(0);
    expect(validSkipNavs).toBeLessThanOrEqual(totalSkipNavs);

    // 3. 페이지 제목 검증
    const pageTitleItem = $('.nav-item').filter((_, el) => 
      $(el).text().includes('페이지 제목')
    );
    expect(pageTitleItem.length).toBeGreaterThan(0);
    
    const pageTitleText = pageTitleItem.text();
    const pageTitleMatch = pageTitleText.match(/페이지 제목 - (\d+) \/ 1/);
    expect(pageTitleMatch).toBeDefined();
    const validPageTitle = parseInt(pageTitleMatch![1]);
    expect(validPageTitle).toBe(0); // case1.html에는 제목이 없으므로 0이어야 함

    // 4. iframe 제목 검증
    const frameItem = $('.nav-item').filter((_, el) => 
      $(el).text().includes('iframe 제목')
    );
    expect(frameItem.length).toBeGreaterThan(0);
    
    const frameText = frameItem.text();
    const frameMatch = frameText.match(/iframe 제목 - (\d+) \/ (\d+)/);
    expect(frameMatch).toBeDefined();
    const validFrames = parseInt(frameMatch![1]);
    const totalFrames = parseInt(frameMatch![2]);
    expect(totalFrames).toBeGreaterThan(0);
    expect(validFrames).toBeLessThanOrEqual(totalFrames);

    // 5. 헤딩 검증
    const headingItem = $('.nav-item').filter((_, el) => 
      $(el).text().includes('헤딩')
    );
    expect(headingItem.length).toBeGreaterThan(0);
    
    const headingText = headingItem.text();
    const headingMatch = headingText.match(/헤딩 - (\d+)/);
    expect(headingMatch).toBeDefined();
    const totalHeadings = parseInt(headingMatch![1]);
    expect(totalHeadings).toBeGreaterThan(0);

    // 6. Language of Page 검증
    const langItem = $('.nav-item').filter((_, el) => 
      $(el).text().includes('Language of Page')
    );
    expect(langItem.length).toBeGreaterThan(0);
    
    const langText = langItem.text();
    const langMatch = langText.match(/Language of Page - (\d+) \/ (\d+)/);
    expect(langMatch).toBeDefined();
    const validLangs = parseInt(langMatch![1]);
    const totalLangs = parseInt(langMatch![2]);
    expect(totalLangs).toBeGreaterThan(0);
    expect(validLangs).toBeGreaterThan(0); // case1.html은 lang="ko"가 있으므로 1이어야 함
    expect(validLangs).toBeLessThanOrEqual(totalLangs);

    // 7. 테이블 검증
    const tableItem = $('.nav-item').filter((_, el) => 
      $(el).text().includes('테이블')
    );
    expect(tableItem.length).toBeGreaterThan(0);
    
    const tableText = tableItem.text();
    const tableMatch = tableText.match(/테이블 - (\d+) \/ (\d+)/);
    expect(tableMatch).toBeDefined();
    const validTables = parseInt(tableMatch![1]);
    const totalTables = parseInt(tableMatch![2]);
    expect(totalTables).toBeGreaterThan(0);
    expect(validTables).toBeLessThanOrEqual(totalTables);

    // 8. 입력 필드 라벨 검증
    const labelItem = $('.nav-item').filter((_, el) => 
      $(el).text().includes('입력 필드 라벨')
    );
    expect(labelItem.length).toBeGreaterThan(0);
    
    const labelText = labelItem.text();
    const labelMatch = labelText.match(/입력 필드 라벨 - (\d+) \/ (\d+)/);
    expect(labelMatch).toBeDefined();
    const validLabels = parseInt(labelMatch![1]);
    const totalLabels = parseInt(labelMatch![2]);
    expect(totalLabels).toBeGreaterThan(0);
    expect(validLabels).toBeLessThanOrEqual(totalLabels);

    // 실제 테이블 데이터도 검증
    const imageTable = $('#section-images .result-table');
    expect(imageTable.length).toBeGreaterThan(0);
    
    const imageRows = imageTable.find('tr').length - 1; // 헤더 제외
    expect(imageRows).toBe(totalImages);

    // fail/warning 이미지가 있는지 확인
    const failImages = imageTable.find('.fail').length;
    const warningImages = imageTable.find('.warning').length;
    expect(failImages + warningImages).toBeGreaterThan(0);
  });

  it('should return empty results when no URL is provided', async () => {
    const response = await req(app.getHttpServer()).get('/analyze').expect(200);

    const html = response.text;
    const $ = cheerio.load(html);

    // URL이 없을 때는 빈 결과 페이지가 표시되어야 함
    expect(html).toContain('웹접근성 검사기');
    expect(html).toContain('URL을 입력하세요');

    // 분석 결과는 없어야 함
    expect(html).not.toContain('웹접근성 분석 결과');
    
    // 네비게이션 항목들이 없어야 함
    const navItems = $('.nav-item');
    expect(navItems.length).toBe(0);
  });
});
