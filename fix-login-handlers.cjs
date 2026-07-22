const fs = require('fs');
let code = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

// Fix Lock import
code = code.replace(/import \{([\s\S]*?)\} from "lucide-react";/, (match, group) => {
  if (!group.includes('Lock')) {
    return `import {${group}, Lock} from "lucide-react";`;
  }
  return match;
});

fs.writeFileSync('src/components/LoginView.tsx', code);
