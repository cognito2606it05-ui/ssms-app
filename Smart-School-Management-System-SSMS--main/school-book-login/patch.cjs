const fs = require('fs');

try {
  let app = fs.readFileSync('src/App.tsx', 'utf8');
  let dash = fs.readFileSync('src/components/Dashboards.tsx', 'utf8');

  const rootVars = new Set();
  const varReg = /^\s*const (\[[a-zA-Z0-9_\s,]+\]|[a-zA-Z0-9_]+)\s*=/gm;
  let match;
  while ((match = varReg.exec(app)) !== null) {
    let v = match[1];
    if (v.startsWith('[')) {
      v.slice(1, -1).split(',').forEach(part => rootVars.add(part.trim()));
    } else {
      rootVars.add(v.trim());
    }
  }

  const funcReg = /^\s*const\s+([a-zA-Z0-9_]+)\s*=\s*(async\s*)?\([^)]*\)\s*=>/gm;
  while ((match = funcReg.exec(app)) !== null) {
    rootVars.add(match[1].trim());
  }

  const rawFuncReg = /^\s*function\s+([a-zA-Z0-9_]+)\s*\(/gm;
  while ((match = rawFuncReg.exec(app)) !== null) {
    rootVars.add(match[1].trim());
  }

  const extraVars = [
    'db', 'auth', 'collection', 'addDoc', 'updateDoc', 'deleteDoc', 'doc', 'setDoc', 'getDoc', 'query', 'where', 'serverTimestamp', 'getDocs', 'getDocFromServer',
    'signInWithEmailAndPassword', 'signOut', 'onAuthStateChanged', 'createUserWithEmailAndPassword', 'sendEmailVerification', 'sendPasswordResetEmail',
    'signInWithPopup', 'GoogleAuthProvider', 'updateProfile', 'setPersistence', 'browserLocalPersistence', 'browserSessionPersistence',
    'ROLE_PASSWORDS', 'MOCK_USERS', 'INITIAL_TEACHERS', 'INITIAL_STUDENTS', 'INITIAL_PARENTS', 'INITIAL_STAFF', 'INITIAL_BUS_ROUTES', 'roles', 
  ];
  extraVars.forEach(ev => rootVars.add(ev));

  ['appState', 'SmartIDCardModal', 'ViewDetailsModal', 'ReceiptModal'].forEach(c => rootVars.delete(c));

  const allVars = Array.from(rootVars).filter(v => v);

  const destructureRegex = /  const \{\s*[\s\S]*?\s*\} = appState \|\| \{\};/g;
  const newDestructureCode = `  const {
    ${allVars.join(',\n    ')}
  } = appState || {};`;
  dash = dash.replace(destructureRegex, newDestructureCode);

  const appStateRegex = /  const appState: any = \{\s*[\s\S]*?\s*\};\n/g;
  const newAppStateCode = `  const appState: any = {
    ${allVars.join(',\n    ')}
  };\n`;
  app = app.replace(appStateRegex, newAppStateCode);

  // Re-fix failed extractions in App.tsx
  app = app.replace(/<SmartIDCardModal appState=\{appState\}/g, '<SmartIDCardModal');
  app = app.replace(/<ViewDetailsModal appState=\{appState\}/g, '<ViewDetailsModal');
  app = app.replace(/<ReceiptModal appState=\{appState\}/g, '<ReceiptModal');

  fs.writeFileSync('src/App.tsx', app);
  fs.writeFileSync('src/components/Dashboards.tsx', dash);
  console.log('Patch complete.');
} catch(e) { console.error(e); }
