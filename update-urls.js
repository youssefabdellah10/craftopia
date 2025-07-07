const fs = require('fs');
const path = require('path');

// Function to recursively find all .jsx files
function findJSXFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findJSXFiles(filePath, fileList);
    } else if (file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update a single file
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const hasLocalhost = content.includes('http://localhost:3000');
    
    if (hasLocalhost) {
      console.log(`Updating ${filePath}`);
      
      // Check if API_BASE_URL import already exists
      const hasImport = content.includes("import { API_BASE_URL } from '../utils/api'") ||
                       content.includes("import { API_BASE_URL } from '../utils/api.js'");
      
      if (!hasImport) {
        // Find the last import statement
        const importRegex = /import.*from.*['"'][^'"]+['"];/g;
        const imports = content.match(importRegex);
        
        if (imports && imports.length > 0) {
          const lastImport = imports[imports.length - 1];
          const importIndex = content.lastIndexOf(lastImport);
          
          if (importIndex !== -1) {
            const endIndex = importIndex + lastImport.length;
            const beforeImport = content.substring(0, endIndex);
            const afterImport = content.substring(endIndex);
            
            // Determine the correct relative path
            const relativePath = filePath.includes('Components') ? '../utils/api' : '../utils/api';
            
            content = beforeImport + `\nimport { API_BASE_URL } from '${relativePath}';` + afterImport;
          }
        }
      }
      
      // Replace all localhost:3000 URLs with API_BASE_URL
      content = content.replace(/http:\/\/localhost:3000/g, '${API_BASE_URL}');
      content = content.replace(/https:\/\/craftopia-backend-youssefabdellah10-dev\.apps\.rm3\.7wse\.p1\.openshiftapps\.com/g, '${API_BASE_URL}');
      
      // Replace string concatenation with template literals
      content = content.replace(/(['"])\$\{API_BASE_URL\}([^'"]*)\1/g, '`${API_BASE_URL}$2`');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Main execution
console.log('Starting URL update process...');

const srcDir = path.join(__dirname, 'src');
const jsxFiles = findJSXFiles(srcDir);

console.log(`Found ${jsxFiles.length} JSX files to check`);

jsxFiles.forEach(file => updateFile(file));

console.log('\n✅ All files updated successfully!');
console.log('\n📝 Next steps:');
console.log('1. Add .env to your .gitignore file');
console.log('2. Create .env.example with: VITE_API_BASE_URL=http://localhost:3000');
console.log('3. Test your application to ensure everything works correctly');
