import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

const desktop = await page.evaluate(() => {
	const features = document.getElementById('features');
	const section = document.getElementById('theme-preferences');
	const viewport = document.documentElement.clientWidth;
	return {
		viewport,
		featuresWidth: features
			? Math.round(features.getBoundingClientRect().width)
			: null,
		featuresLeft: features
			? Math.round(features.getBoundingClientRect().left)
			: null,
		sectionWidth: section
			? Math.round(section.getBoundingClientRect().width)
			: null,
		docWidth: document.documentElement.scrollWidth,
	};
});

await page.setViewportSize({ width: 375, height: 812 });
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

const mobile = await page.evaluate(() => ({
	viewport: document.documentElement.clientWidth,
	docWidth: document.documentElement.scrollWidth,
	overflow:
		document.documentElement.scrollWidth > document.documentElement.clientWidth,
}));

console.log(JSON.stringify({ desktop, mobile }, null, 2));
await browser.close();
