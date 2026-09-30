const fs = require('fs');

try {
  let content = fs.readFileSync('src/App.tsx', 'utf8');

  const componentsToExtract = [
    'LeftSideContent', 'TeacherManagement', 'StudentManagement', 'AIAssistant', 'SmartIDCardModal', 'ViewDetailsModal',
    'AddModal', 'ReportCardModal', 'LibraryManagement', 'SubjectManagement', 'HomeworkManagement', 'ResultManagement',
    'PayrollManagement', 'StoreManagement', 'TeacherDashboard', 'AccountsDashboard', 'SecurityDashboard', 'StoreDashboard',
    'ReceptionDashboard', 'StudentDashboard', 'ParentDashboard', 'TransportManagement', 'ReceiptModal', 'LeaveManagement',
    'AlertCenter', 'SecurityManagement', 'FeesManagement', 'ContactManagement', 'ManagementManagement', 'SettingsManagement',
    'MyAttendance', 'MyFees', 'MyTransport', 'ChildProgress', 'StudentGrades', 'StudentAttendance', 'StudentFees',
    'FinancialReports', 'SecurityLogs', 'StockManagement', 'PurchaseOrders', 'VisitorLog', 'AdmissionsManagement', 'AdminOverview'
  ];

  // Extract all variables defined at the root of AppContent to build the massive destructurer
  const appContentMatch = content.match(/function AppContent\(\) \{([\s\S]+?)return \(/);
  if (!appContentMatch) throw new Error("Could not find AppContent body start");
  
  const appContentBody = appContentMatch[1];
  const rootVars = new Set();
  const varReg = /const (\[[a-zA-Z0-9_\s,]+\]|[a-zA-Z0-9_]+)\s*=/g;
  let match;
  while ((match = varReg.exec(appContentBody)) !== null) {
    let v = match[1];
    if (v.startsWith('[')) {
      v.slice(1, -1).split(',').forEach(part => rootVars.add(part.trim()));
    } else {
      rootVars.add(v.trim());
    }
  }
  // Add some constants that are imported or defined outside AppContent but used inside components
  const extraVars = [
    'db', 'auth', 'collection', 'addDoc', 'updateDoc', 'deleteDoc', 'doc', 'setDoc', 'getDoc', 'query', 'where', 'serverTimestamp', 'getDocs', 'getDocFromServer',
    'signInWithEmailAndPassword', 'signOut', 'onAuthStateChanged', 'createUserWithEmailAndPassword', 'sendEmailVerification', 'sendPasswordResetEmail',
    'signInWithPopup', 'GoogleAuthProvider', 'updateProfile', 'setPersistence', 'browserLocalPersistence', 'browserSessionPersistence',
    'ROLE_PASSWORDS', 'MOCK_USERS', 'INITIAL_TEACHERS', 'INITIAL_STUDENTS', 'INITIAL_PARENTS', 'INITIAL_STAFF', 'INITIAL_BUS_ROUTES', 'roles', 
  ];
  extraVars.forEach(ev => rootVars.add(ev));
  
  // Remove any sub-components from rootVars to avoid self/circular references
  componentsToExtract.forEach(c => rootVars.delete(c));

  const stateVarsStr = `  const {
    ${Array.from(rootVars).join(', ')}
  } = appState || {};`;

  let extractedCode = `import React, { useState, useEffect, useRef } from 'react';\n`;
  extractedCode += `import { motion, AnimatePresence } from 'framer-motion';\n`;
  const lucideImports = content.match(/import\s+\{[^{}]+\}\s+from\s+'lucide-react';/);
  if (lucideImports) extractedCode += lucideImports[0] + '\n';
  const rechartsImports = content.match(/import\s+\{[^{}]+\}\s+from\s+'recharts';/);
  if (rechartsImports) extractedCode += rechartsImports[0] + '\n';
  const constantsImports = content.match(/import\s+\{[^{}]+\}\s+from\s+'\.\/constants';/);
  if (constantsImports) extractedCode += constantsImports[0] + '\n';
  const mockFirebaseImports = content.match(/import\s+\{[^{}]+\}\s+from\s+'\.\/localDatabase';/);
  if (mockFirebaseImports) extractedCode += mockFirebaseImports[0] + '\n';
  
  // Define types briefly to satisfy TS (lazy imports)
  extractedCode += `import { UserRole, User, Teacher, Student, Parent, Staff, Subject, BusRoute, AttendanceRecord, StoreItem, LeaveRequest, Alert, Reservation, ExamResult, Homework } from './types';\n`;

  extractedCode += `\n// --- Extracted Dashboards & Components ---\n\n`;

  let newContent = content;
  
  for (const comp of componentsToExtract) {
    const regex = new RegExp(`  const ${comp}\\s*=\\s*\\(([^)]*)\\)\\s*=>\\s*({|\\()`);
    const compMatch = newContent.match(regex);
    if (!compMatch) {
      console.warn('Could not find component:', comp);
      continue;
    }
    
    let startIndex = compMatch.index;
    let funcStartStr = compMatch[0];
    let bodyStartIdx = startIndex + funcStartStr.length - 1;
    let openChar = funcStartStr.slice(-1);
    let closeChar = openChar === '{' ? '}' : ')';
    
    let openCount = 1;
    let i = bodyStartIdx + 1;
    while(openCount > 0 && i < newContent.length) {
      if (newContent[i] === openChar) openCount++;
      if (newContent[i] === closeChar) openCount--;
      i++;
    }
    let endIndex = i;
    if (newContent[endIndex] === ';') endIndex++;
    
    let compBody = newContent.slice(startIndex, endIndex);
    newContent = newContent.slice(0, startIndex) + newContent.slice(endIndex);
    
    let paramsRaw = compMatch[1].trim(); 
    // Modify component to accept appState and inject state destructuring
    if (openChar === '{') {
       if (paramsRaw && paramsRaw.startsWith('{')) {
         // Destructured params: e.g. { student }: { student: Student }
         compBody = compBody.replace(regex, `export const ${comp} = ({ appState, ...props }: any) => {\n${stateVarsStr}\n  // @ts-ignore\n  const ${paramsRaw.split(':')[0]} = props;\n`);
       } else if (paramsRaw && !paramsRaw.startsWith('{')) {
         compBody = compBody.replace(regex, `export const ${comp} = ({ appState, ...props }: any) => {\n${stateVarsStr}\n  // @ts-ignore\n  const ${paramsRaw.split(':')[0]} = props;\n`);
       } else {
         compBody = compBody.replace(regex, `export const ${comp} = ({ appState }: any) => {\n${stateVarsStr}\n`);
       }
    } else {
       if (paramsRaw && paramsRaw.startsWith('{')) {
         compBody = compBody.replace(regex, `export const ${comp} = ({ appState, ...props }: any) => {\n${stateVarsStr}\n  // @ts-ignore\n  const ${paramsRaw.split(':')[0]} = props;\n  return (`);
       } else {
         compBody = compBody.replace(regex, `export const ${comp} = ({ appState }: any) => {\n${stateVarsStr}\n  return (`);
       }
       compBody = compBody.replace(/\);?\s*$/, ');\n};');
    }
    
    // Auto-fix some common React hook references missing context
    // Just inject the component
    extractedCode += '// @ts-nocheck\n' + compBody + '\n\n';
  }

  // Now, inject building the `appState` object into App.tsx right before `return (` of AppContent
  const returnRegex = /  return \(\s*<ErrorBoundary>/;
  const buildStateCode = `
  const appState = {
    ${Array.from(rootVars).join(', ')}
  };
`;
  newContent = newContent.replace(returnRegex, buildStateCode + '\n  return (\n    <ErrorBoundary>');

  // And append `<Component appState={appState} />` everywhere a component is called
  for (const comp of componentsToExtract) {
    // regex to catch <Component /> and <Component prop=val />
    const tagObjRegex = new RegExp(`<${comp}\\s+([^>]*?)/?>`, 'g');
    newContent = newContent.replace(tagObjRegex, (match, propsGroup) => {
       if (propsGroup && propsGroup.trim().length > 0) {
         if (match.endsWith('/>')) {
           return `<${comp} appState={appState} ${propsGroup}/>`;
         } else {
           return `<${comp} appState={appState} ${propsGroup}>`;
         }
       } else {
         if (match.endsWith('/>')) {
           return `<${comp} appState={appState} />`;
         } else {
           return `<${comp} appState={appState}>`;
         }
       }
    });

    const pureTagRegex = new RegExp(`<${comp}>`, 'g');
    newContent = newContent.replace(pureTagRegex, `<${comp} appState={appState}>`);
  }

  // Add the imports for Dashboards components at the top of App.tsx
  const importCode = `import { ${componentsToExtract.join(', ')} } from './components/Dashboards';\n`;
  newContent = newContent.replace(/import \{ QRGenerator \} from '.\/components\/QRGenerator';/, importCode + "import { QRGenerator } from './components/QRGenerator';");

  fs.writeFileSync('src/App.tsx', newContent);
  fs.writeFileSync('src/components/Dashboards.tsx', extractedCode);
  console.log("Success! Extracted " + componentsToExtract.length + " components.");
} catch (e) {
  console.error("Error formatting:", e);
}
