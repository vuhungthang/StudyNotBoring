// build-css.js
const fs = require('fs');
const path = require('path');

// Define the order of CSS files to concatenate
const cssFiles = [
  'src/assets/minimalist-theme.css',
  'src/assets/professional-theme.css',
  'src/assets/components.css'
];

// Output file
const outputFile = 'dist/bundle.css';

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Concatenate CSS files
let bundleContent = '';
cssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    bundleContent += `/* ${file} */
${content}

`;
  } else {
    console.warn(`Warning: ${file} not found`);
  }
});

// Write the bundled CSS to output file
fs.writeFileSync(outputFile, bundleContent);
console.log(`CSS bundle created: ${outputFile}`);