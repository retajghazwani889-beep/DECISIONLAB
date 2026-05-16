import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function updateTypography(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    let content = fs.readFileSync(filePath, 'utf-8');

    // Muted/Secondary descriptions text size
    content = content.replace(/text-sm text-brand-text-muted/g, 'text-xl text-brand-text-muted');
    content = content.replace(/text-sm text-brand-text-secondary/g, 'text-xl text-brand-text-secondary');
    content = content.replace(/text-base text-brand-text-muted/g, 'text-xl text-brand-text-muted');
    content = content.replace(/text-base text-brand-text-secondary/g, 'text-xl text-brand-text-secondary');
    content = content.replace(/text-xs text-brand-text-muted/g, 'text-xl text-brand-text-muted');
    content = content.replace(/text-xs text-brand-text-secondary/g, 'text-xl text-brand-text-secondary');
    content = content.replace(/text-lg text-brand-text-muted/g, 'text-xl text-brand-text-muted');
    content = content.replace(/text-lg text-brand-text-secondary/g, 'text-xl text-brand-text-secondary');

    // Specific targeted lines that might have explicit sizes
    content = content.replace(/text-\[9px\]/g, 'text-base');
    content = content.replace(/text-\[10px\]/g, 'text-lg');
    content = content.replace(/text-\[11px\]/g, 'text-lg');
    content = content.replace(/text-\[12px\]/g, 'text-xl');
    content = content.replace(/text-\[13px\]/g, 'text-xl');
    content = content.replace(/text-\[14px\]/g, 'text-xl');
    content = content.replace(/text-\[15px\]/g, 'text-xl');
    content = content.replace(/text-\[16px\]/g, 'text-xl');
    content = content.replace(/text-\[18px\]/g, 'text-xl');

    // For general badges / labels
    content = content.replace(/text-xs font-black/g, 'text-lg font-black');
    content = content.replace(/text-sm font-black/g, 'text-xl font-black');
    content = content.replace(/text-xs uppercase/g, 'text-lg uppercase');
    content = content.replace(/text-sm uppercase/g, 'text-xl uppercase');

    // Simple paragraph/span styles
    content = content.replace(/className="text-base /g, 'className="text-xl ');
    content = content.replace(/className="text-sm /g, 'className="text-xl ');

    fs.writeFileSync(filePath, content, 'utf-8');
}

walkDir('./src/components', updateTypography);
walkDir('./src/pages', updateTypography);
console.log('Typography updated successfully.');
