import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. 路径通用获取
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 2. 递归获取所有 CSS 文件
function getAllCssFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllCssFiles(filePath));
    } else if (file.endsWith('.css')) {
      results.push(filePath);
    }
  }
  return results;
}

// 3. 匹配变量定义和使用
function extractCssVariables(files) {
  const defined = new Set();
  const used = new Set();

  files.forEach(file => {
    const css = fs.readFileSync(file, 'utf8');
    // 匹配变量定义（--xxx:）
    for (const m of css.matchAll(/--([a-zA-Z0-9-_]+)\s*:/g)) {
      defined.add(m[1]);
    }
    // 匹配 var(--xxx)
    for (const m of css.matchAll(/var$--([a-zA-Z0-9-_]+)$/g)) {
      used.add(m[1]);
    }
  });

  return { defined, used };
}

// 4. 主函数
function main() {
  const stylesDir = path.join(rootDir, 'src', 'styles');
  const files = getAllCssFiles(stylesDir);
  const { defined, used } = extractCssVariables(files);
  const unused = [...defined].filter(k => !used.has(k));
  console.log('检查的CSS文件:', files.join(', '));
  if (unused.length === 0) {
    console.log('所有变量都被使用了！');
  } else {
    console.log('未被使用的CSS变量:');
    unused.forEach(name => {
      console.log(`--${name}`);
    });
  }
}

main();