const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

const targetFunctionStart = 'function NewsPostMedia({ post }: { post: PublicPost }) {';
const targetFunctionEnd = 'function NewsFeed({ onBusiness, onOpenPublish }:';

const startIdx = content.indexOf(targetFunctionStart);
const endIdx = content.indexOf(targetFunctionEnd);

console.log('Found startIdx:', startIdx);
console.log('Found endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const currentMediaCode = content.substring(startIdx, endIdx);
  console.log('Current NewsPostMedia code:\n', currentMediaCode);
}
