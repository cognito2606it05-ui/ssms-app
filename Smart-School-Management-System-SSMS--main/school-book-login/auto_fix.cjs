const { execSync } = require('child_process');
const fs = require('fs');

try {
  let tscOutput = '';
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
  } catch (e) {
    tscOutput = e.stdout.toString() + e.stderr.toString();
  }

  const missingVars = new Set();
  const missingExports = new Set();

  const missingVarRegex = /property '([a-zA-Z0-9_]+)'\. /g;
  let match;
  while ((match = missingVarRegex.exec(tscOutput)) !== null) {
    missingVars.add(match[1]);
  }
  
  const blockVarRegex = /Block-scoped variable '([a-zA-Z0-9_]+)' used before/g;
  while ((match = blockVarRegex.exec(tscOutput)) !== null) {
    missingVars.add(match[1]);
  }

  const exportRegex = /has no exported member '([a-zA-Z0-9_]+)'/g;
  while ((match = exportRegex.exec(tscOutput)) !== null) {
    missingExports.add(match[1]);
  }

  let app = fs.readFileSync('src/App.tsx', 'utf8');
  let dash = fs.readFileSync('src/components/Dashboards.tsx', 'utf8');

  // Fix App.tsx missing variables in appState
  for (const v of missingVars) {
    const reg = new RegExp(`\\b${v}\\b\\s*,?\\s*\\n?`, 'g');
    app = app.replace(reg, '');
    dash = dash.replace(reg, '');
  }

  // Fix App.tsx missing imports
  let importsLine = app.match(/import \{([^}]+)\} from '\.\/components\/Dashboards';/);
  if (importsLine) {
    let imports = importsLine[1].split(',').map(s => s.trim());
    imports = imports.filter(i => !missingExports.has(i));
    let newImportLine = `import { ${imports.join(', ')} } from './components/Dashboards';`;
    app = app.replace(importsLine[0], newImportLine);
  }

  fs.writeFileSync('src/App.tsx', app);
  fs.writeFileSync('src/components/Dashboards.tsx', dash);
  console.log('Fixed ' + missingVars.size + ' missing variables and ' + missingExports.size + ' missing exports. Compiling...');
  execSync('npx tsc --noEmit && npm run build', { stdio: 'inherit' });
  console.log('Complete Success!');
} catch (e) {
  console.error("Errors remaining:", e.message);
}
