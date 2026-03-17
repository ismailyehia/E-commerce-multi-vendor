const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
            const content = fs.readFileSync(fullPath, 'utf8');

            // Replace word boundary _id with id
            if (content.match(/\b_id\b/)) {
                const newContent = content.replace(/\b_id\b/g, 'id');
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fullPath.replace('c:\\web development\\E-commerce multivendor\\frontend\\src\\', '')}`);
            }
        }
    }
}

const targetDir = 'c:\\web development\\E-commerce multivendor\\frontend\\src';
console.log('Starting migration _id -> id...');
processDir(targetDir);
console.log('Migration complete!');
