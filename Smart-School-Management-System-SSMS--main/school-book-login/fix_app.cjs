const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Extract the mis-placed appState block
const appStateMatch = app.match(/\s*const appState: any = \{[\s\S]*?\};\n/);
if (appStateMatch) {
  const appStateBlock = appStateMatch[0];
  // Remove it from current location
  app = app.replace(appStateBlock, '');

  // 2. Inject it riiiight above `const renderDashboard = () => {`
  app = app.replace('  const renderDashboard = () => {', appStateBlock + '\n  const renderDashboard = () => {');

  fs.writeFileSync('src/App.tsx', app);
  console.log('Successfully relocated appState block into AppContent context!');
} else {
  console.log('Could not find appState block in App.tsx');
}
