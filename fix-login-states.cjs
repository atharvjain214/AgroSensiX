const fs = require('fs');

let code = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

// 1. Remove the duplicated states
code = code.replace(`  const [isRecoveryCodeSent, setIsRecoveryCodeSent] = useState(false);\n  const [isCodeVerified, setIsCodeVerified] = useState(false);\n`, '');
code = code.replace(`  const [recoveryCode, setRecoveryCode] = useState("");\n  const [newPassword, setNewPassword] = useState("");\n  const [confirmNewPassword, setConfirmNewPassword] = useState("");\n`, '');

fs.writeFileSync('src/components/LoginView.tsx', code);
