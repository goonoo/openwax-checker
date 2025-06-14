import * as puppeteer from 'puppeteer';
import {
  checkImages,
  checkBgImages,
  checkSkipNav,
  checkPageTitle,
  checkFrames,
  checkHeadings,
  checkInputLabels,
} from './rule';

export interface ImageInfo {
  src: string;
  alt: string | null;
  hidden: boolean;
}

export interface SkipNavInfo {
  label: string;
  value: string;
  connected: boolean;
  valid: string;
}

export interface FrameInfo {
  label: string;
  value: string;
  contents: string;
  valid: string;
  hidden: boolean;
}

export interface PageTitleInfo {
  title: string;
  valid: string;
}

export interface HeadingInfo {
  label: string;
  value: string;
  contents: string;
  valid: string;
  hidden: boolean;
}

export interface InputLabelInfo {
  hidden: boolean;
  element: string;
  type: string;
  valid: string;
  title: string;
  hasLabel: boolean;
  hasTitle: boolean;
}

export async function extractImagesFromPage(
  page: puppeteer.Page,
): Promise<ImageInfo[]> {
  const images = await page.evaluate(checkImages);
  return images;
}

export async function extractBgImagesFromPage(
  page: puppeteer.Page,
): Promise<ImageInfo[]> {
  const bgImages = await page.evaluate(checkBgImages);
  return bgImages;
}

export async function extractSkipNavFromPage(
  page: puppeteer.Page,
): Promise<SkipNavInfo[]> {
  const skipNavigations = await page.evaluate(checkSkipNav);
  return skipNavigations;
}

export async function extractPageTitleFromPage(
  page: puppeteer.Page,
): Promise<PageTitleInfo> {
  const pageTitle = await page.evaluate(checkPageTitle);
  return pageTitle;
}

export async function extractFramesFromPage(
  page: puppeteer.Page,
): Promise<FrameInfo[]> {
  const frames = await page.evaluate(checkFrames);
  return frames;
}

export async function extractHeadingsFromPage(
  page: puppeteer.Page,
): Promise<HeadingInfo[]> {
  const headings = await page.evaluate(checkHeadings);
  return headings;
}

export async function extractInputLabelsFromPage(
  page: puppeteer.Page,
): Promise<InputLabelInfo[]> {
  const inputLabels = await page.evaluate(checkInputLabels);
  return inputLabels;
}
