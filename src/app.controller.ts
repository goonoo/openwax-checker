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
  extractImagesFromPage,
  extractBgImagesFromPage,
  extractSkipNavFromPage,
  extractPageTitleFromPage,
  extractFramesFromPage,
  extractHeadingsFromPage,
  extractInputLabelsFromPage,
  extractPageLangFromPage,
  extractTablesFromPage,
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
        url: '',
      };
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      executablePath: '/usr/bin/chromium',
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const images = await extractImagesFromPage(page);
    const bgImages = await extractBgImagesFromPage(page);
    const skipNavigations = await extractSkipNavFromPage(page);
    const pageTitle = await extractPageTitleFromPage(page);
    const frames = await extractFramesFromPage(page);
    const headings = await extractHeadingsFromPage(page);
    const inputLabels = await extractInputLabelsFromPage(page);
    const pageLang = await extractPageLangFromPage(page);
    const tables = await extractTablesFromPage(page);

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
      url,
    };
  }
}
