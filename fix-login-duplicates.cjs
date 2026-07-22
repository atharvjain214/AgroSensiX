const fs = require('fs');
let code = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

// I will remove the SECOND handleVerifyCode and handleResetPassword
let verifyIndex1 = code.indexOf('const handleVerifyCode = async');
let verifyIndex2 = code.indexOf('const handleVerifyCode = async', verifyIndex1 + 10);

if (verifyIndex2 !== -1) {
  let resetIndex2 = code.indexOf('const handleResetPassword = async', verifyIndex2);
  let nextFuncIndex = code.indexOf('const handleLogin = async', resetIndex2);
  
  // Cut out the duplicate blocks
  code = code.slice(0, verifyIndex2) + code.slice(nextFuncIndex);
}

fs.writeFileSync('src/components/LoginView.tsx', code);
