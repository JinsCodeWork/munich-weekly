/**
 * 从SVG生成favicon.png的转换脚本
 * 
 * 使用方法:
 * 1. 安装所需包：npm install sharp
 * 2. 运行：node scripts/convert-favicon.js
 */

const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const sourceFile = path.join(__dirname, '../public/favicon.svg');
const targetFile = path.join(__dirname, '../public/favicon.png');
const appleIconFile = path.join(__dirname, '../public/apple-icon.png');

async function convertToPng() {
  console.log('开始转换favicon...');
  
  try {
    if (!fs.existsSync(sourceFile)) {
      throw new Error(`源文件 ${sourceFile} 不存在`);
    }
    
    // 读取SVG文件
    const svgBuffer = fs.readFileSync(sourceFile);
    
    // 生成标准favicon.png (32x32)
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(targetFile);
    
    console.log(`成功生成favicon.png文件: ${targetFile}`);
    
    // 生成Apple Touch Icon (180x180)
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(appleIconFile);
    
    console.log(`成功生成apple-icon.png文件: ${appleIconFile}`);
    
  } catch (error) {
    console.error('转换过程中出错:', error.message);
  }
}

convertToPng(); 