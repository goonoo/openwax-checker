import { Controller, Get, Post, Body, Render } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import {
  extractImagesFromPage,
  extractBgImagesFromPage,
  ImageInfo,
  extractSkipNavFromPage,
  SkipNavInfo,
  extractPageTitleFromPage,
  PageTitleInfo,
  extractFramesFromPage,
  FrameInfo,
  extractHeadingsFromPage,
  HeadingInfo,
} from './utils/accessibility-checker';

@Controller()
export class AppController {
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
      url: null,
    };
  }

  @Post('analyze')
  @Render('index')
  async analyze(@Body('url') url: string): Promise<{
    images: ImageInfo[];
    bgImages: ImageInfo[];
    skipNavigations: SkipNavInfo[];
    pageTitle: PageTitleInfo;
    frames: FrameInfo[];
    headings: HeadingInfo[];
    url: string;
  }> {
    if (!url)
      return {
        images: [],
        bgImages: [],
        skipNavigations: [],
        pageTitle: { title: '', correct: false },
        frames: [],
        headings: [],
        url: '',
      };
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const images = await extractImagesFromPage(page);
    const bgImages = await extractBgImagesFromPage(page);
    const skipNavigations = await extractSkipNavFromPage(page);
    const pageTitle = await extractPageTitleFromPage(page);
    const frames = await extractFramesFromPage(page);
    const headings = await extractHeadingsFromPage(page);

    await browser.close();
    return {
      images,
      bgImages,
      skipNavigations,
      pageTitle,
      frames,
      headings,
      url,
    };
  }
}
