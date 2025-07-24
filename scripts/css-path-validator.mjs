/**
 * CSS路径验证脚本
 * 用于检查项目中所有组件引用的CSS文件路径是否正确
 * 特别关注大小写敏感性问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 获取styles目录中所有CSS文件的实际名称（保留大小写）
const getActualCssFiles = () => {
  const stylesDir = path.join(rootDir, 'src', 'styles');
  const files = fs.readdirSync(stylesDir);
  return files.filter(file => file.endsWith('.css'));
};

// 在项目中查找所有引用CSS文件的import语句
const findCssImports = (dir) => {
  const imports = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // 递归搜索子目录
      imports.push(...findCssImports(fullPath));
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      // 检查TS/TSX文件中的CSS导入
      const content = fs.readFileSync(fullPath, 'utf8');
      const cssImportRegex = /import\s+['"](\.\.?\/styles\/[\w-]+\.css)['"];/g;
      let match;
      
      while ((match = cssImportRegex.exec(content)) !== null) {
        imports.push({
          file: fullPath,
          importPath: match[1],
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
  }
  
  return imports;
};

// 验证CSS导入路径
const validateCssImports = () => {
  const actualCssFiles = getActualCssFiles();
  const cssImports = findCssImports(path.join(rootDir, 'src'));
  const errors = [];
  
  for (const importInfo of cssImports) {
    // 从导入路径中提取CSS文件名
    const importedFileName = path.basename(importInfo.importPath);
    
    // 检查文件名是否存在（区分大小写）
    if (!actualCssFiles.includes(importedFileName)) {
      // 尝试查找大小写不敏感的匹配
      const caseInsensitiveMatch = actualCssFiles.find(
        file => file.toLowerCase() === importedFileName.toLowerCase()
      );
      
      if (caseInsensitiveMatch) {
        errors.push({
          file: path.relative(rootDir, importInfo.file),
          line: importInfo.line,
          importPath: importInfo.importPath,
          actualFile: caseInsensitiveMatch,
          type: 'case-mismatch'
        });
      } else {
        errors.push({
          file: path.relative(rootDir, importInfo.file),
          line: importInfo.line,
          importPath: importInfo.importPath,
          type: 'missing-file'
        });
      }
    }
  }
  
  return errors;
};

// 主函数
const main = () => {
  console.log('🔍 验证CSS文件引用路径...');
  const errors = validateCssImports();
  
  if (errors.length === 0) {
    console.log('✅ 所有CSS文件引用路径正确！');
    process.exit(0);
  }
  
  console.log('❌ 发现以下CSS引用路径问题:');
  
  for (const error of errors) {
    if (error.type === 'case-mismatch') {
      console.log(`
文件: ${error.file}:${error.line}
引用: ${error.importPath}
实际: ${error.actualFile}
问题: 大小写不匹配`);
    } else {
      console.log(`
文件: ${error.file}:${error.line}
引用: ${error.importPath}
问题: 文件不存在`);
    }
  }
  
  console.log(`
总计: ${errors.length} 个问题
`);
  console.log('提示: 在Linux环境中，文件路径区分大小写，请确保引用路径与实际文件名完全匹配。');
  process.exit(1);
};

main();