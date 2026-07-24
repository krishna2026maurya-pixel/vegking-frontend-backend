const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

let allFiles = [];
targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    allFiles = allFiles.concat(walk(dir));
  }
});

let modifiedFiles = 0;
let replacedCount = 0;

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Regex to match fetch('/api/...
  // It handles both single quotes and double quotes
  // We use replace with a replacer function

  // 1. Match fetch('/api/...' or fetch("/api/..."
  // It captures the quote type and the URL path.
  content = content.replace(/fetch\(\s*(['"])(\/api\/.*?)\1/g, (match, quote, urlPath) => {
    replacedCount++;
    // Since we are changing to template string, we must make sure we don't break things.
    // fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/...`)
    return `fetch(\`\${process.env.NEXT_PUBLIC_API_URL || ''}${urlPath}\``;
  });

  // 2. Match fetch(`/api/...` (template literals)
  // It captures the URL path and anything after it up to the backtick.
  content = content.replace(/fetch\(\s*`(\/api\/.*?)`/g, (match, urlPath) => {
    replacedCount++;
    return `fetch(\`\${process.env.NEXT_PUBLIC_API_URL || ''}${urlPath}\``;
  });

  // 3. What if it has fetch(`/api/banners/${id}`) ? 
  // The regex above will match `/api/banners/${id}` inside the backticks.
  // Wait, the regex `\/api\/.*?` might stop too early if we use lazy matching `*?`, 
  // but it's bound by the closing backtick in `/fetch\(\s*`(\/api\/.*?)`/g`.
  // Oh wait, `.*?` will stop at the FIRST backtick. Which is correct for a template string that doesn't have nested backticks (rare).

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`\nReplacement complete!`);
console.log(`Modified ${modifiedFiles} files.`);
console.log(`Replaced ${replacedCount} fetch calls.`);
