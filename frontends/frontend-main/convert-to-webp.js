const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));

async function convertToWebP(inputPath, outputPath, quality = 85) {
  try {
    const info = await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);

    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

    console.log(`✅ ${path.basename(inputPath)}`);
    console.log(`   Before: ${(inputStats.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   After:  ${(outputStats.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Reduction: ${reduction}%\n`);

    return {
      input: inputPath,
      output: outputPath,
      inputSize: inputStats.size,
      outputSize: outputStats.size,
      reduction: parseFloat(reduction)
    };
  } catch (error) {
    console.error(`❌ Failed to convert ${inputPath}:`, error.message);
    return null;
  }
}

async function main() {
  const baseDir = '/home/jhay/projects/ante-official/frontends/frontend-main';
  process.chdir(baseDir);

  // Find all PNG and JPEG files
  const patterns = [
    'src/assets/**/*.png',
    'src/assets/**/*.jpg',
    'src/assets/**/*.jpeg',
    'public/**/*.png',
    'public/**/*.jpg',
    'public/**/*.jpeg'
  ];

  let allFiles = [];
  for (const pattern of patterns) {
    const files = await glob(pattern, { nodir: true });
    allFiles = allFiles.concat(files);
  }

  // Filter out backup folders
  allFiles = allFiles.filter(f => !f.includes('/backup/'));

  console.log(`Found ${allFiles.length} images to convert\n`);
  console.log('=' .repeat(60));
  console.log('\n');

  const results = [];

  for (const inputFile of allFiles) {
    // Create backup
    const backupPath = inputFile.replace(/\/(src\/assets|public)\//, '/$1/backup/');
    const backupDir = path.dirname(backupPath);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputFile, backupPath);
    }

    // Convert to WebP (keep same location, change extension)
    const outputFile = inputFile.replace(/\.(png|jpg|jpeg)$/i, '.webp');

    const result = await convertToWebP(inputFile, outputFile);
    if (result) {
      results.push(result);
    }
  }

  // Summary
  console.log('=' .repeat(60));
  console.log('SUMMARY');
  console.log('=' .repeat(60));

  const totalInputSize = results.reduce((sum, r) => sum + r.inputSize, 0);
  const totalOutputSize = results.reduce((sum, r) => sum + r.outputSize, 0);
  const totalReduction = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);

  console.log(`\nTotal files converted: ${results.length}`);
  console.log(`Total size before: ${(totalInputSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Total size after:  ${(totalOutputSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Total reduction:   ${totalReduction}%`);
  console.log(`Space saved:       ${((totalInputSize - totalOutputSize) / 1024 / 1024).toFixed(2)}MB\n`);
}

main().catch(console.error);
