import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function revertTypography(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    let content = fs.readFileSync(filePath, 'utf-8');

    content = content.replace(/\btext-xl\b/g, 'text-sm');
    content = content.replace(/\btext-lg\b/g, 'text-xs');

    fs.writeFileSync(filePath, content, 'utf-8');
}

walkDir('./src/components', revertTypography);
walkDir('./src/pages', revertTypography);
console.log('Typography reverted.');
