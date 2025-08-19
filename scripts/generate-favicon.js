import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import PNG2Icons from 'png2icons';

async function generateFavicon() {
  try {
    console.log('🔄 Generating high-resolution favicon.ico...');
    
    // Read the SVG file
    const svgBuffer = fs.readFileSync('public/favicon.svg');
    
    // Define optimized sizes for favicon.ico (standard sizes only)
    const sizes = [16, 32, 48];
    
    // Generate PNG buffers for each size
    const pngBuffers = await Promise.all(
      sizes.map(async (size) => {
        const buffer = await sharp(svgBuffer)
          .resize(size, size, {
            kernel: sharp.kernel.lanczos3,
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png({ 
            compressionLevel: 9,
            adaptiveFiltering: true,
            force: true
          })
          .toBuffer();
        
        console.log(`✅ Generated ${size}x${size} PNG`);
        return { size, buffer };
      })
    );
    
    // Save individual PNG files for reference
    pngBuffers.forEach(({ size, buffer }) => {
      fs.writeFileSync(`public/favicon-${size}x${size}.png`, buffer);
      console.log(`✅ Saved favicon-${size}x${size}.png`);
    });
    
    // Create a simple, small favicon.ico (just 32x32 for fast loading)
    const standardFavicon = pngBuffers.find(p => p.size === 32);
    if (standardFavicon) {
      fs.writeFileSync('public/favicon.ico', standardFavicon.buffer);
      console.log('✅ Created fast-loading favicon.ico (32x32)');
    }
    
    console.log('🎉 Fast favicon generation complete!');
    console.log('📁 Files created:');
    console.log('   - public/favicon.ico (32x32 - fast loading)');
    console.log('   - public/favicon-16x16.png, favicon-32x32.png, favicon-48x48.png');
    console.log('⚡ Optimized for speed with minimal file sizes!');
    
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
