const fs = require('fs');

let code = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

// 1. Add missing state variables
code = code.replace(
  `const [isForgotPassword, setIsForgotPassword] = useState(false);`,
  `const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [isRecoveryCodeSent, setIsRecoveryCodeSent] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");`
);

// 2. Fix Google Auth parameter
code = code.replace(
  `prompt: 'select_account'`,
  `prompt: 'select_account consent'`
);

// 3. Replace handleSendRecoveryCode
const handleSendCodeRegex = /const handleSendRecoveryCode = async \([^)]*\) => {[\s\S]*?return;[\s\S]*?}[\s\S]*?};/;

const newHandlers = `const handleSendRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorText("Email address is required.");
      return;
    }
    setIsScanning(true);
    setErrorText(null);
    setSuccessText(null);
    try {
      const res = await fetch("/api/auth/recover/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setIsRecoveryCodeSent(true);
        if (data.emailSent) {
          setSuccessText("Secure 6-digit code dispatched to your email!");
        } else {
          setSuccessText("Code dispatched! (Dev Mode: Check terminal for the code as GMAIL_APP_PASSWORD is not set)");
        }
      } else {
        setErrorText(data.error || "Failed to send code");
      }
    } catch (err: any) {
      setErrorText(err.message || "Network error");
    } finally {
      setIsScanning(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryCode.length !== 6) {
      setErrorText("Code must be exactly 6 digits.");
      return;
    }
    setIsScanning(true);
    setErrorText(null);
    try {
      const res = await fetch("/api/auth/recover/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), code: recoveryCode })
      });
      const data = await res.json();
      if (res.ok) {
        setIsCodeVerified(true);
        setSuccessText("Code verified successfully. Please enter your new password.");
      } else {
        setErrorText(data.error || "Invalid or expired code.");
      }
    } catch (err: any) {
      setErrorText(err.message || "Network error");
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErrorText("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorText("Password must be at least 8 characters.");
      return;
    }
    setIsScanning(true);
    setErrorText(null);
    try {
      const res = await fetch("/api/auth/recover/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), code: recoveryCode, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessText("Password successfully updated. You may now login.");
        setTimeout(() => {
          setIsForgotPassword(false);
          setIsCodeVerified(false);
          setIsRecoveryCodeSent(false);
          setSuccessText(null);
        }, 3000);
      } else {
        setErrorText(data.error || "Failed to reset password.");
      }
    } catch (err: any) {
      setErrorText(err.message || "Network error");
    } finally {
      setIsScanning(false);
    }
  };`;

code = code.replace(handleSendCodeRegex, newHandlers);

// 4. Update the render forms
const formRegex = /{!isRecoveryCodeSent && \([\s\S]*?<\/form>\s*\)}/m;

const replacementForms = `
              {!isRecoveryCodeSent && (
                <form onSubmit={handleSendRecoveryCode} className="space-y-4 font-mono text-left">
                  <div className="space-y-1.5 text-xs">
                    <label className="text-zinc-500 uppercase tracking-widest font-bold">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          setErrorText(null);
                        }}
                        disabled={isScanning}
                        placeholder="Enter your email address"
                        className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none placeholder-zinc-805"
                      />
                      <Mail className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1">A verification code will be sent to the email address entered above.</p>
                  </div>

                  {errorText && (
                    <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-center">
                      <p className="text-rose-400 text-xs font-bold uppercase tracking-wide leading-normal">
                        {errorText}
                      </p>
                    </div>
                  )}
                  {successText && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-center">
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide leading-normal animate-pulse">
                        {successText}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isScanning}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-[#000] disabled:opacity-40 font-sans font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-lg tracking-wider text-xs active:scale-[0.98] mt-2"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#000]" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Code</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {isRecoveryCodeSent && !isCodeVerified && (
                <form onSubmit={handleVerifyCode} className="space-y-4 font-mono text-left">
                  <div className="space-y-1.5 text-xs">
                    <label className="text-zinc-500 uppercase tracking-widest font-bold">6-Digit Code</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={recoveryCode}
                        onChange={(e) => {
                          setRecoveryCode(e.target.value.replace(/\\D/g, '').slice(0, 6));
                          setErrorText(null);
                        }}
                        disabled={isScanning}
                        placeholder="000000"
                        className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none placeholder-zinc-805 tracking-widest"
                      />
                      <Key className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  {errorText && (
                    <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-center">
                      <p className="text-rose-400 text-xs font-bold uppercase tracking-wide leading-normal">
                        {errorText}
                      </p>
                    </div>
                  )}
                  {successText && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-center">
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide leading-normal animate-pulse">
                        {successText}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isScanning || recoveryCode.length !== 6}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-[#000] disabled:opacity-40 font-sans font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-lg tracking-wider text-xs active:scale-[0.98] mt-2"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#000]" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {isCodeVerified && (
                <form onSubmit={handleResetPassword} className="space-y-4 font-mono text-left">
                  <div className="space-y-1.5 text-xs">
                    <label className="text-zinc-500 uppercase tracking-widest font-bold">New Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setErrorText(null);
                        }}
                        disabled={isScanning}
                        placeholder="Min 8 chars, 1 uppercase, 1 special"
                        className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none placeholder-zinc-805"
                      />
                      <Lock className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="text-zinc-500 uppercase tracking-widest font-bold">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          setErrorText(null);
                        }}
                        disabled={isScanning}
                        placeholder="Re-type new password"
                        className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none placeholder-zinc-805"
                      />
                      <Lock className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  {errorText && (
                    <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-center">
                      <p className="text-rose-400 text-xs font-bold uppercase tracking-wide leading-normal">
                        {errorText}
                      </p>
                    </div>
                  )}
                  {successText && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-center">
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide leading-normal animate-pulse">
                        {successText}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isScanning}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-[#000] disabled:opacity-40 font-sans font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-lg tracking-wider text-xs active:scale-[0.98] mt-2"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#000]" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                </form>
              )}
`;

code = code.replace(formRegex, replacementForms);

fs.writeFileSync('src/components/LoginView.tsx', code);
