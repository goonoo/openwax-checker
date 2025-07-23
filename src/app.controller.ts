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
  async analyze(@Query('url') url: string): Promise<{
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
      const browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 3000 });

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

      await browser.close();
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
      };
    } catch {
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
      };
    }
  }
}
