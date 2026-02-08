const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const INPUT_DIR = path.join(__dirname, '../images/edit');
const OUTPUT_DIR = path.join(__dirname, '../images/optimized');

async function optimizeImages() {
  // Create output directory if it doesn't exist
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const files = await fs.readdir(INPUT_DIR);
  
  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const ext = path.extname(file).toLowerCase();
    
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      const outputPath = path.join(OUTPUT_DIR, `${path.parse(file).name}.webp`);
      
      try {
        await sharp(inputPath)
          .webp({ quality: 80, effort: 6 })
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .toFile(outputPath);
        
        const originalSize = (await fs.stat(inputPath)).size;
        const newSize = (await fs.stat(outputPath)).size;
        console.log(`✓ ${file} → ${path.basename(outputPath)} (${Math.round(originalSize/1024)}KB → ${Math.round(newSize/1024)}KB, -${Math.round((1-newSize/originalSize)*100)}%)`);
      } catch (error) {
        console.error(`✗ Failed to optimize ${file}:`, error.message);
      }
    }
  }
  
  console.log('\n✨ Optimization complete!');
}

optimizeImages().catch(console.error);
