import { Controller, Get, Render, Query } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import {
  ImageInfo,
  SkipNavInfo,
  PageTitleInfo,
  FrameInfo,
  HeadingInfo,
  InputLabelInfo,
  PageLangInfo,
  TableInfo,
  UserRequestInfo,
  FocusInfo,
  WebApplicationInfo,
  extractImagesFromPage,
  extractBgImagesFromPage,
  extractSkipNavFromPage,
  extractPageTitleFromPage,
  extractFramesFromPage,
  extractHeadingsFromPage,
  extractInputLabelsFromPage,
  extractPageLangFromPage,
  extractTablesFromPage,
  extractUserRequestFromPage,
  extractFocusFromPage,
  extractWebApplicationFromPage,
} from './utils/accessibility-checker';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get()
  @Render('index')
  getIndex() {
    return {
      images: null,
      bgImages: null,
      skipNavigations: null,
      pageTitle: null,
      frames: null,
      headings: null,
      inputLabels: null,
      pageLang: null,
      tables: null,
      focus: null,
      userRequest: null,
      webApplication: null,
      url: null,
    };
  }

  @Get('analyze')
  @Render('index')
  async analyze(
    @Query('url') url: string,
    @Query('debug') debug?: string,
  ): Promise<{
    images: ImageInfo[];
    bgImages: ImageInfo[];
    skipNavigations: SkipNavInfo[];
    pageTitle: PageTitleInfo;
    frames: FrameInfo[];
    headings: HeadingInfo[];
    inputLabels: InputLabelInfo[];
    pageLang: PageLangInfo[];
    tables: TableInfo[];
    focus: FocusInfo[];
    userRequest: UserRequestInfo[];
    webApplication: WebApplicationInfo[];
    url: string;
    debugHtml?: string;
  }> {
    if (!url)
      return {
        images: [],
        bgImages: [],
        skipNavigations: [],
        pageTitle: { title: '', valid: 'fail' },
        frames: [],
        headings: [],
        inputLabels: [],
        pageLang: [],
        tables: [],
        focus: [],
        userRequest: [],
        webApplication: [],
        url: '',
      };

    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;

    try {
      // puppeteer 실행 옵션을 환경에 따라 분기
      const launchOptions: any = {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      };
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }
      browser = await puppeteer.launch(launchOptions);
      page = await browser.newPage();

      // 페이지 타임아웃 설정
      page.setDefaultTimeout(10000);

      // DOM이 로드되면 바로 진행, 네트워크 idle은 기다리지 않음
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

      // 추가 렌더링을 위한 짧은 대기 (최대 3초)
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 기본 1초 대기
        // body나 main 컨텐츠가 있는지 확인하고 추가 대기
        await page.waitForSelector('body', { timeout: 2000 }).catch(() => {});
      } catch (error) {
        // 대기 중 에러가 발생해도 계속 진행
        console.warn(
          'Additional wait failed, proceeding with analysis:',
          error,
        );
      }

      // debug 모드일 때 HTML 가져오기
      let debugHtml: string | undefined;
      if (debug === '1') {
        debugHtml = await page.content();
      }

      const images = await extractImagesFromPage(page);
      const bgImages = await extractBgImagesFromPage(page);
      const skipNavigations = await extractSkipNavFromPage(page);
      const pageTitle = await extractPageTitleFromPage(page);
      const frames = await extractFramesFromPage(page);
      const headings = await extractHeadingsFromPage(page);
      const inputLabels = await extractInputLabelsFromPage(page);
      const pageLang = await extractPageLangFromPage(page);
      const tables = await extractTablesFromPage(page);
      const focus = await extractFocusFromPage(page);
      const userRequest = await extractUserRequestFromPage(page);
      const webApplication = await extractWebApplicationFromPage(page);

      return {
        images,
        bgImages,
        skipNavigations,
        pageTitle,
        frames,
        headings,
        inputLabels,
        pageLang,
        tables,
        focus,
        userRequest,
        webApplication,
        url,
        debugHtml,
      };
    } catch (error) {
      console.error('Error in analyze:', error);
      return {
        images: [],
        bgImages: [],
        skipNavigations: [],
        pageTitle: { title: '', valid: 'fail' },
        frames: [],
        headings: [],
        inputLabels: [],
        pageLang: [],
        tables: [],
        focus: [],
        userRequest: [],
        webApplication: [],
        url: url,
        debugHtml: undefined,
      };
    } finally {
      // 리소스 정리 보장
      if (page) {
        try {
          await page.close();
        } catch (error) {
          console.error('Error closing page:', error);
        }
      }
      if (browser) {
        try {
          await browser.close();
        } catch (error) {
          console.error('Error closing browser:', error);
        }
      }
    }
  }

  @Get('report')
  @Render('report')
  async generateReport(@Query('url') url: string): Promise<{
    images: ImageInfo[];
    bgImages: ImageInfo[];
    skipNavigations: SkipNavInfo[];
    pageTitle: PageTitleInfo;
    frames: FrameInfo[];
    headings: HeadingInfo[];
    inputLabels: InputLabelInfo[];
    pageLang: PageLangInfo[];
    tables: TableInfo[];
    focus: FocusInfo[];
    userRequest: UserRequestInfo[];
    webApplication: WebApplicationInfo[];
    url: string;
    totalPages: number;
  }> {
    if (!url) {
      return {
        images: [],
        bgImages: [],
        skipNavigations: [],
        pageTitle: { title: '', valid: 'fail' },
        frames: [],
        headings: [],
        inputLabels: [],
        pageLang: [],
        tables: [],
        focus: [],
        userRequest: [],
        webApplication: [],
        url: '',
        totalPages: 0,
      };
    }

    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;

    try {
      // puppeteer 실행 옵션을 환경에 따라 분기
      const launchOptions: any = {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      };
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }
      browser = await puppeteer.launch(launchOptions);
      page = await browser.newPage();

      // 페이지 타임아웃 설정
      page.setDefaultTimeout(10000);

      // DOM이 로드되면 바로 진행, 네트워크 idle은 기다리지 않음
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

      // 추가 렌더링을 위한 짧은 대기 (최대 3초)
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 기본 1초 대기
        // body나 main 컨텐츠가 있는지 확인하고 추가 대기
        await page.waitForSelector('body', { timeout: 2000 }).catch(() => {});
      } catch (error) {
        // 대기 중 에러가 발생해도 계속 진행
        console.warn(
          'Additional wait failed, proceeding with analysis:',
          error,
        );
      }

      const images = await extractImagesFromPage(page);
      const bgImages = await extractBgImagesFromPage(page);
      const skipNavigations = await extractSkipNavFromPage(page);
      const pageTitle = await extractPageTitleFromPage(page);
      const frames = await extractFramesFromPage(page);
      const headings = await extractHeadingsFromPage(page);
      const inputLabels = await extractInputLabelsFromPage(page);
      const pageLang = await extractPageLangFromPage(page);
      const tables = await extractTablesFromPage(page);
      const focus = await extractFocusFromPage(page);
      const userRequest = await extractUserRequestFromPage(page);
      const webApplication = await extractWebApplicationFromPage(page);

      return {
        images,
        bgImages,
        skipNavigations,
        pageTitle,
        frames,
        headings,
        inputLabels,
        pageLang,
        tables,
        focus,
        userRequest,
        webApplication,
        url,
        totalPages: 1, // 현재는 단일 페이지만 분석
      };
    } catch (error) {
      console.error('Error in generateReport:', error);
      return {
        images: [],
        bgImages: [],
        skipNavigations: [],
        pageTitle: { title: '', valid: 'fail' },
        frames: [],
        headings: [],
        inputLabels: [],
        pageLang: [],
        tables: [],
        focus: [],
        userRequest: [],
        webApplication: [],
        url: url,
        totalPages: 0,
      };
    } finally {
      // 리소스 정리 보장
      if (page) {
        try {
          await page.close();
        } catch (error) {
          console.error('Error closing page:', error);
        }
      }
      if (browser) {
        try {
          await browser.close();
        } catch (error) {
          console.error('Error closing browser:', error);
        }
      }
    }
  }
}
