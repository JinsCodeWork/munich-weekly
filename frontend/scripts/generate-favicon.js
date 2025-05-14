/**
 * favicon生成脚本
 * 
 * 请按照以下步骤操作：
 * 
 * 1. 安装所需的包：
 *    npm install favicons --save-dev
 * 
 * 2. 运行此脚本：
 *    node scripts/generate-favicon.js
 */

const favicons = require('favicons');
const fs = require('fs');
const path = require('path');

const source = 'public/logo.svg'; // 源SVG文件
const OUTPUT_DIR = 'public'; // 输出目录

// favicon配置
const configuration = {
  path: '/', // 网站上的路径
  appName: 'Munich Weekly',
  appShortName: 'Munich',
  appDescription: 'Photography submissions and voting platform.',
  developerName: 'Munich Weekly Team',
  developerURL: 'https://munich-weekly.com',
  background: '#fff',
  theme_color: '#000',
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: false,
    favicons: true,
    windows: false,
    yandex: false,
  },
};

console.log(`[开始] 正在从 ${source} 生成favicon...`);

favicons(source, configuration)
  .then((response) => {
    const { images, files, html } = response;
    
    // 创建目录（如果不存在）
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // 保存图像到输出目录
    images.forEach((image) => {
      fs.writeFileSync(
        path.join(OUTPUT_DIR, image.name),
        image.contents
      );
      console.log(`[生成] ${image.name}`);
    });
    
    // 保存文件到输出目录
    files.forEach((file) => {
      fs.writeFileSync(
        path.join(OUTPUT_DIR, file.name),
        file.contents
      );
      console.log(`[生成] ${file.name}`);
    });
    
    // 输出HTML标签信息
    console.log('\n[HTML标签] 可以将以下标签添加到HTML头部：');
    console.log(html.join('\n'));
    
    console.log('\n[完成] favicon生成完毕！');
  })
  .catch((error) => {
    console.error('[错误]', error.message);
  }); 