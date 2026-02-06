const fs = require('fs');
const path = require('path');

// Template directories that contain SCORM content
const templateDirs = [
  'accordion',
  'contentreveal', 
  'crossword',
  'dragdrop',
  'extracted_scorm',
  'flipcards',
  'Game Arena',
  'imagehotspot',
  'infocard',
  'interactivevideo',
  'labeldiagram',
  'matchingpairs',
  'mcq',
  'mentaldrag',
  'pickmany',
  'scorm',
  'sorting',
  'survey',
  'timeline',
  'truefalse',
  'wordsearch'
];

// File extensions to process
const fileExtensions = ['.html', '.js', '.css', '.xml'];

// Check if a file has one of the target extensions
function hasValidExtension(filePath) {
  return fileExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
}

// Update any relative paths to Vercel-safe paths (handles both relative and already absolute paths)
function updateToVercelSafePaths(content, templateName) {
  let updatedContent = content;

  // Pattern for src attributes (converts relative paths to Vercel-safe)
  updatedContent = updatedContent.replace(/(\ssrc\s*=\s*["'])([^"'>\s]+)\1/gi, (match, attrPrefix, filePath) => {
    // Skip if it's already a Vercel-safe path, absolute path, or external URL
    if (filePath.startsWith('/Gaming-Template/') || filePath.startsWith('/') || 
        filePath.startsWith('http') || filePath.startsWith('data:') || filePath.startsWith('#')) {
      return match; // Don't change if it's already absolute or external
    }
    
    // Convert relative path to Vercel-safe path
    const vercelPath = `/Gaming-Template/${templateName}/${filePath}`;
    return attrPrefix + vercelPath + '"';
  });

  // Pattern for href attributes (converts relative paths to Vercel-safe)
  updatedContent = updatedContent.replace(/(\shref\s*=\s*["'])([^"'>\s]+)\1/gi, (match, attrPrefix, filePath) => {
    // Skip if it's already a Vercel-safe path, absolute path, or external URL
    if (filePath.startsWith('/Gaming-Template/') || filePath.startsWith('/') || 
        filePath.startsWith('http') || filePath.startsWith('data:') || filePath.startsWith('#')) {
      return match; // Don't change if it's already absolute or external
    }
    
    // Convert relative path to Vercel-safe path
    const vercelPath = `/Gaming-Template/${templateName}/${filePath}`;
    return attrPrefix + vercelPath + '"';
  });

  // Pattern for CSS url() functions (converts relative paths to Vercel-safe)
  updatedContent = updatedContent.replace(/(:\s*url\s*\(\s*["']?)([^"')>\s]+)["']?\s*\)/gi, (match, prefix, filePath) => {
    // Skip if it's already a Vercel-safe path, absolute path, or external URL
    if (filePath.startsWith('/Gaming-Template/') || filePath.startsWith('/') || 
        filePath.startsWith('http') || filePath.startsWith('data:')) {
      return match; // Don't change if it's already absolute or external
    }
    
    // Convert relative path to Vercel-safe path
    const vercelPath = `/Gaming-Template/${templateName}/${filePath}`;
    return prefix + vercelPath + '"';
  });

  return updatedContent;
}

// Update Vercel-safe paths back to SCORM-safe relative paths
function updateToScormRelativePaths(content, templateName) {
  // Match Vercel-safe paths like /Gaming-Template/templateName/some/path
  // and convert them back to relative paths
  const vercelPathRegex = new RegExp(`/Gaming-Template/${templateName}/([^'">\\s\\)]+)`, 'g');
  
  return content.replace(vercelPathRegex, (match, relativePath) => {
    return relativePath;
  });
}

// Process a template directory for Vercel-safe paths
async function processTemplateForVercel(templateDir) {
  console.log(`Processing ${templateDir} for Vercel-safe paths...`);
  
  const processDir = async (dir) => {
    const items = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        await processDir(fullPath);
      } else if (hasValidExtension(item.name)) {
        const content = await fs.promises.readFile(fullPath, 'utf8');
        const updatedContent = updateToVercelSafePaths(content, templateDir);
        
        if (content !== updatedContent) {
          await fs.promises.writeFile(fullPath, updatedContent, 'utf8');
          console.log(`  Updated paths in: ${fullPath}`);
        }
      }
    }
  };
  
  const templatePath = path.join(__dirname, templateDir);
  if (fs.existsSync(templatePath)) {
    await processDir(templatePath);
  }
}

// Create SCORM build with relative paths
async function createScormBuild(templateDir) {
  console.log(`Creating SCORM build for ${templateDir}...`);
  
  const sourcePath = path.join(__dirname, templateDir);
  const buildPath = path.join(__dirname, 'scorm-builds', templateDir);
  
  // Ensure build directory exists
  await fs.promises.mkdir(buildPath, { recursive: true });
  
  const copyDir = async (src, dest) => {
    const items = await fs.promises.readdir(src, { withFileTypes: true });
    
    for (const item of items) {
      const srcPath = path.join(src, item.name);
      const destPath = path.join(dest, item.name);
      
      if (item.isDirectory()) {
        await fs.promises.mkdir(destPath, { recursive: true });
        await copyDir(srcPath, destPath);
      } else if (hasValidExtension(item.name)) {
        const content = await fs.promises.readFile(srcPath, 'utf8');
        const updatedContent = updateToScormRelativePaths(content, templateDir);
        
        await fs.promises.writeFile(destPath, updatedContent, 'utf8');
      } else {
        // Copy binary files without modification
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  };
  
  if (fs.existsSync(sourcePath)) {
    await copyDir(sourcePath, buildPath);
  }
}

// Validate imsmanifest.xml in SCORM build
async function validateImsManifest(templateDir) {
  console.log(`Validating imsmanifest.xml for ${templateDir}...`);
  
  const manifestPath = path.join(__dirname, 'scorm-builds', templateDir, 'imsmanifest.xml');
  
  if (!fs.existsSync(manifestPath)) {
    console.log(`  No imsmanifest.xml found for ${templateDir}`);
    return true;
  }
  
  try {
    const content = await fs.promises.readFile(manifestPath, 'utf8');
    
    let isValid = true;
    let scormVersion = 'Unknown';
    let launchFile = null;
    
    // Check for SCORM version
    if (content.includes('schemaversion>1.2<')) {
      scormVersion = '1.2';
    } else if (content.includes('schemaversion>2004 3rd Edition<') || content.includes('imsss_v1p0')) {
      scormVersion = '2004';
    } else if (content.includes('schemaversion>1.1<')) {
      scormVersion = '1.1';
    }
    
    // Find launch file
    const launchFileMatch = content.match(/href\s*=\s*["']([^"']+)["'][^>]*adlcp:scormtype="sco"/i);
    if (launchFileMatch) {
      launchFile = launchFileMatch[1];
    }
    
    // Check if launch file exists
    if (launchFile) {
      const launchFilePath = path.join(__dirname, 'scorm-builds', templateDir, launchFile);
      if (!fs.existsSync(launchFilePath)) {
        console.log(`  ERROR: Launch file does not exist: ${launchFile}`);
        isValid = false;
      }
    }
    
    // Check for other referenced files
    const fileMatches = content.matchAll(/<file\s+href\s*=\s*["']([^"']+)["']/gi);
    for (const match of fileMatches) {
      const filePath = match[1];
      const fullPath = path.join(__dirname, 'scorm-builds', templateDir, filePath);
      if (!fs.existsSync(fullPath)) {
        console.log(`  WARNING: Referenced file does not exist: ${filePath}`);
        // Note: We don't set isValid to false for missing files as they might not be critical
      }
    }
    
    console.log(`  SCORM Version: ${scormVersion}`);
    if (launchFile) {
      console.log(`  Launch file: ${launchFile}`);
    }
    
    return isValid;
  } catch (error) {
    console.log(`  ERROR validating manifest: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Starting Vercel-safe path hardcoding and SCORM build generation...\n');
  
  // Part A: Vercel-safe path hardcoding
  console.log('=== PART A: Vercel-safe path hardcoding ===');
  for (const templateDir of templateDirs) {
    try {
      await processTemplateForVercel(templateDir);
    } catch (error) {
      console.log(`Error processing ${templateDir}: ${error.message}`);
    }
  }
  
  console.log('\n=== PART B: SCORM build generation ===');
  for (const templateDir of templateDirs) {
    try {
      await createScormBuild(templateDir);
    } catch (error) {
      console.log(`Error creating SCORM build for ${templateDir}: ${error.message}`);
    }
  }
  
  console.log('\n=== PART C: imsmanifest.xml validation ===');
  let allValid = true;
  for (const templateDir of templateDirs) {
    try {
      const isValid = await validateImsManifest(templateDir);
      if (!isValid) {
        allValid = false;
      }
    } catch (error) {
      console.log(`Error validating ${templateDir}: ${error.message}`);
      allValid = false;
    }
  }
  
  console.log('\n=== FINAL VALIDATION ===');
  if (allValid) {
    console.log('All validations passed!');
  } else {
    console.log('Some validations failed. Please check the logs above.');
  }
  
  console.log('\nProcess completed!');
}

// Run the main function
main().catch(console.error);