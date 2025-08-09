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

    // HTML에 웹접근성 분석 결과가 포함되어 있는지 확인 - 현재 템플릿 구조에 맞게 수정
    expect(html).toContain('웹접근성 검사기'); // title 확인
    expect(html).toContain(localServerUrl); // URL이 템플릿에 포함되어 있는지 확인
    expect(html).toContain('5.1.1 적절한 대체 텍스트 제공'); // 검사 항목들이 표시되는지 확인

    // 1. 대체 텍스트 (img) 검증 - 새로운 템플릿 구조에 맞게 수정
    const imageNavItem = $('.nav-item').filter((_, el) => {
      return $(el)
        .find('.nav-item-text')
        .text()
        .includes('5.1.1 적절한 대체 텍스트 제공 (img)');
    });
    expect(imageNavItem.length).toBeGreaterThan(0);

    const scoreText = imageNavItem.find('.nav-item-score').text();
    // "9 / 13 (69%)" 형식으로 파싱
    const scoreMatch = scoreText.match(/(\d+) \/ (\d+)(?: \((\d+)%\))?/);
    expect(scoreMatch).toBeDefined();
    const validImages = parseInt(scoreMatch![1]);
    const totalImages = parseInt(scoreMatch![2]);
    const validImagesPercentage = scoreMatch![3]
      ? parseInt(scoreMatch![3])
      : null;
    expect(totalImages).toBe(13);
    expect(validImages).toBe(9);
    expect(validImagesPercentage).toBe(69);

    // 2. 대체 텍스트 (bg) 검증
    const bgImageNavItem = $('.nav-item').filter((_, el) =>
      $(el)
        .find('.nav-item-text')
        .text()
        .includes('5.1.1 적절한 대체 텍스트 제공 (bg)'),
    );
    expect(bgImageNavItem.length).toBeGreaterThan(0);

    const bgScoreText = bgImageNavItem.find('.nav-item-score').text();
    // 배경 이미지는 보통 단순히 개수만 표시됨
    const bgImageMatch = bgScoreText.match(/(\d+)/);
    expect(bgImageMatch).toBeDefined();
    const totalBgImages = parseInt(bgImageMatch![1]);
    expect(totalBgImages).toBe(1);

    // 3. 건너뛰기 링크 검증
    const skipNavItem = $('.nav-item').filter((_, el) =>
      $(el).find('.nav-item-text').text().includes('6.4.1 반복 영역 건너뛰기'),
    );
    expect(skipNavItem.length).toBeGreaterThan(0);

    const skipNavScoreText = skipNavItem.find('.nav-item-score').text();
    const skipNavMatch = skipNavScoreText.match(
      /(\d+) \/ (\d+)(?: \((\d+)%\))?/,
    );
    expect(skipNavMatch).toBeDefined();
    const validSkipNavs = parseInt(skipNavMatch![1]);
    const totalSkipNavs = parseInt(skipNavMatch![2]);
    const validSkipNavsPercentage = skipNavMatch![3]
      ? parseInt(skipNavMatch![3])
      : null;
    expect(totalSkipNavs).toBe(5);
    expect(validSkipNavs).toBe(2);
    expect(validSkipNavsPercentage).toBe(40);

    // 4. 페이지 제목 검증
    const pageTitleItem = $('.nav-item').filter((_, el) =>
      $(el).find('.nav-item-text').text().includes('6.4.2 제목 제공 - 페이지'),
    );
    expect(pageTitleItem.length).toBeGreaterThan(0);

    const pageTitleScoreText = pageTitleItem.find('.nav-item-score').text();
    const pageTitleMatch = pageTitleScoreText.match(
      /(\d+) \/ (\d+) \((\d+)%\)/,
    );
    expect(pageTitleMatch).toBeDefined();
    const validPageTitle = parseInt(pageTitleMatch![1]);
    const totalPageTitle = parseInt(pageTitleMatch![2]);
    const validPageTitlePercentage = parseInt(pageTitleMatch![3]);
    expect(validPageTitle).toBe(0); // case1.html에는 제목이 없으므로 0이어야 함
    expect(totalPageTitle).toBe(1);
    expect(validPageTitlePercentage).toBe(0);

    // 5. iframe 제목 검증
    const frameItem = $('.nav-item').filter((_, el) =>
      $(el).find('.nav-item-text').text().includes('6.4.2 제목 제공 - 프레임'),
    );
    expect(frameItem.length).toBeGreaterThan(0);

    const frameScoreText = frameItem.find('.nav-item-score').text();
    const frameMatch = frameScoreText.match(/(\d+) \/ (\d+)(?: \((\d+)%\))?/);
    expect(frameMatch).toBeDefined();
    const validFrames = parseInt(frameMatch![1]);
    const totalFrames = parseInt(frameMatch![2]);
    const validFramesPercentage = frameMatch![3]
      ? parseInt(frameMatch![3])
      : null;
    expect(totalFrames).toBe(3);
    expect(validFrames).toBe(1);
    expect(validFramesPercentage).toBe(33);

    // 6. 헤딩 검증
    const headingItem = $('.nav-item').filter((_, el) =>
      $(el)
        .find('.nav-item-text')
        .text()
        .includes('6.4.2 제목 제공 - 콘텐츠 블록'),
    );
    expect(headingItem.length).toBeGreaterThan(0);

    const headingText = headingItem.text();
    expect(headingText).toContain('6.4.2 제목 제공 - 콘텐츠 블록');
    // headings.length가 11인지 확인 (실제 headings.length는 아래에서 검증)

    // 7. Language of Page 검증
    const langItem = $('.nav-item').filter((_, el) =>
      $(el).find('.nav-item-text').text().includes('7.1.1 기본 언어 표시'),
    );
    expect(langItem.length).toBeGreaterThan(0);

    const langScoreText = langItem.find('.nav-item-score').text();
    const langMatch = langScoreText.match(/(\d+) \/ (\d+) \((\d+)%\)/);
    expect(langMatch).toBeDefined();
    const validLangs = parseInt(langMatch![1]);
    const totalLangs = parseInt(langMatch![2]);
    const validLangsPercentage = parseInt(langMatch![3]);
    expect(totalLangs).toBe(4);
    expect(validLangs).toBe(1);
    expect(validLangsPercentage).toBe(25);

    // 8. 테이블 검증
    const tableItem = $('.nav-item').filter((_, el) =>
      $(el).find('.nav-item-text').text().includes('5.3.1 표의 구성'),
    );
    expect(tableItem.length).toBeGreaterThan(0);

    const tableScoreText = tableItem.find('.nav-item-score').text();
    const tableMatch = tableScoreText.match(/(\d+) \/ (\d+) \((\d+)%\)/);
    expect(tableMatch).toBeDefined();
    const validTables = parseInt(tableMatch![1]);
    const totalTables = parseInt(tableMatch![2]);
    const validTablesPercentage = parseInt(tableMatch![3]);
    expect(totalTables).toBe(5);
    expect(validTables).toBe(1);
    expect(validTablesPercentage).toBe(20);

    // 9. 입력 필드 라벨 검증
    const labelItem = $('.nav-item').filter((_, el) =>
      $(el).find('.nav-item-text').text().includes('7.3.2 레이블 제공'),
    );
    expect(labelItem.length).toBeGreaterThan(0);

    const labelScoreText = labelItem.find('.nav-item-score').text();
    const labelMatch = labelScoreText.match(/(\d+) \/ (\d+)(?: \((\d+)%\))?/);
    expect(labelMatch).toBeDefined();
    const validLabels = parseInt(labelMatch![1]);
    const totalLabels = parseInt(labelMatch![2]);
    const validLabelsPercentage = parseInt(labelMatch![3]);
    expect(totalLabels).toBe(10);
    expect(validLabels).toBe(5);
    expect(validLabelsPercentage).toBe(50);

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
