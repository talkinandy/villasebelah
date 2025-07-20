const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test different screen sizes
const screenSizes = [
  { name: 'mobile-small', width: 320, height: 568, description: 'iPhone SE' },
  { name: 'mobile-medium', width: 375, height: 667, description: 'iPhone 8' },
  { name: 'mobile-large', width: 414, height: 896, description: 'iPhone 11 Pro Max' },
  { name: 'tablet-portrait', width: 768, height: 1024, description: 'iPad Portrait' },
  { name: 'tablet-landscape', width: 1024, height: 768, description: 'iPad Landscape' },
  { name: 'desktop-small', width: 1366, height: 768, description: 'Small Desktop' },
  { name: 'desktop-medium', width: 1440, height: 900, description: 'Medium Desktop' },
  { name: 'desktop-large', width: 1920, height: 1080, description: 'Large Desktop' }
];

async function testVisuals() {
  const browser = await puppeteer.launch({ headless: true });
  
  // Create screenshots directory
  const screenshotsDir = './screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  console.log('🔍 Starting visual testing across different screen sizes...\n');

  for (const size of screenSizes) {
    console.log(`📱 Testing ${size.description} (${size.width}x${size.height})`);
    
    const page = await browser.newPage();
    await page.setViewport({ 
      width: size.width, 
      height: size.height,
      deviceScaleFactor: 2 // High DPI for better quality
    });

    try {
      // Load the local HTML file
      const filePath = 'file://' + path.resolve('./index.html');
      await page.goto(filePath, { waitUntil: 'networkidle0' });

      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Take full page screenshot
      await page.screenshot({
        path: `${screenshotsDir}/${size.name}.png`,
        fullPage: true,
        type: 'png'
      });

      // Analyze specific elements
      const analysis = await page.evaluate(() => {
        const logo = document.querySelector('.logo svg');
        const heroTitle = document.querySelector('.hero h1');
        const navLinks = document.querySelectorAll('nav ul li a');
        const ctaButton = document.querySelector('.cta-button');

        return {
          logo: logo ? {
            width: logo.getBoundingClientRect().width,
            height: logo.getBoundingClientRect().height,
            visible: logo.offsetParent !== null
          } : null,
          heroTitle: heroTitle ? {
            fontSize: window.getComputedStyle(heroTitle).fontSize,
            lineHeight: window.getComputedStyle(heroTitle).lineHeight,
            visible: heroTitle.offsetParent !== null
          } : null,
          navLinks: Array.from(navLinks).map(link => ({
            text: link.textContent,
            fontSize: window.getComputedStyle(link).fontSize,
            visible: link.offsetParent !== null
          })),
          ctaButton: ctaButton ? {
            width: ctaButton.getBoundingClientRect().width,
            height: ctaButton.getBoundingClientRect().height,
            fontSize: window.getComputedStyle(ctaButton).fontSize,
            visible: ctaButton.offsetParent !== null
          } : null,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        };
      });

      console.log(`  ✅ Screenshot saved: ${size.name}.png`);
      console.log(`  📊 Logo: ${analysis.logo?.width}x${analysis.logo?.height}px`);
      console.log(`  📊 Hero Title: ${analysis.heroTitle?.fontSize}`);
      console.log(`  📊 Nav Links: ${analysis.navLinks[0]?.fontSize || 'N/A'}`);
      console.log(`  📊 CTA Button: ${analysis.ctaButton?.width}x${analysis.ctaButton?.height}px\n`);

      // Save analysis data
      fs.writeFileSync(
        `${screenshotsDir}/${size.name}-analysis.json`,
        JSON.stringify({ size, analysis }, null, 2)
      );

    } catch (error) {
      console.error(`  ❌ Error testing ${size.name}:`, error.message);
    }

    await page.close();
  }

  await browser.close();
  
  console.log('🎉 Visual testing complete! Check the screenshots directory for results.');
  console.log('\n📋 Next steps:');
  console.log('1. Review screenshots for proportion issues');
  console.log('2. Check if logo is too small on any screen size');
  console.log('3. Verify navigation readability');
  console.log('4. Ensure CTA buttons are properly sized');
}

// Run the test
testVisuals().catch(console.error);