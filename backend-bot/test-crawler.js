require('dotenv').config();
const { TopCVStrategy } = require('./dist/modules/crawler/strategies/topcv.strategy');
const { TopDevStrategy } = require('./dist/modules/crawler/strategies/topdev.strategy');
const { CareerVietStrategy } = require('./dist/modules/crawler/strategies/careerviet.strategy');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function testCrawler() {
  console.log('Testing Playwright...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const topcv = new TopCVStrategy();
    console.log('Running TopCV...');
    const topcvJobs = await topcv.crawl(page, ['frontend']);
    console.log('TopCV Jobs:', topcvJobs.length);
  } catch(e) {
    console.error('Crawler Error:', e);
  } finally {
    if(browser) await browser.close();
  }
}

testCrawler();
