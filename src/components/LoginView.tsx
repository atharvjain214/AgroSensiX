import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  X,
  Key
} from "lucide-react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, sendPasswordResetEmail, 
  updateProfile
} from "firebase/auth";

interface LoginViewProps {
  onSuccessLogin: (userName: string) => void;
  onCancel?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccessLogin, onCancel }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Recovery States
  const [isRecoveryCodeSent, setIsRecoveryCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  
  const [isScanning, setIsScanning] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // Login attempt protection states
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("agrosensix_failed_attempts") || "0");
    }
    return 0;
  });
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("agrosensix_lockout_until") || "0");
    }
    return 0;
  });

  const getRemainingLockoutTime = () => {
    const now = Date.now();
    if (now < lockoutUntil) {
      return Math.ceil((lockoutUntil - now) / 1000);
    }
    return 0;
  };

  useEffect(() => {
    let interval: any;
    if (lockoutUntil > Date.now()) {
      interval = setInterval(() => {
        if (Date.now() >= lockoutUntil) {
          setLockoutUntil(0);
          localStorage.removeItem("agrosensix_lockout_until");
          setErrorText(null);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleFailedAttempt = () => {
    const nextFailed = failedAttempts + 1;
    setFailedAttempts(nextFailed);
    localStorage.setItem("agrosensix_failed_attempts", nextFailed.toString());
    
    if (nextFailed >= 5) {
      const lockoutTime = Date.now() + 30000; // 30 seconds lockout
      setLockoutUntil(lockoutTime);
      localStorage.setItem("agrosensix_lockout_until", lockoutTime.toString());
      setErrorText("Too many failed login attempts. Locked out for 30 seconds.");
    } else {
      setErrorText(`Incorrect Credentials. Attempt ${nextFailed} of 5 before lockout.`);
    }
  };

  const resetFailedAttempts = () => {
    setFailedAttempts(0);
    setLockoutUntil(0);
    localStorage.removeItem("agrosensix_failed_attempts");
    localStorage.removeItem("agrosensix_lockout_until");
  };

  const handleGoogleAuth = async () => {
    setErrorText(null);
    setSuccessText(null);
    setIsScanning(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account consent'
      });
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      const userRef = doc(db, "users", googleUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: googleUser.uid,
          email: googleUser.email,
          fullName: googleUser.displayName || "Google Agronomist",
          role: "Farmer",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          profileImage: googleUser.photoURL || "",
          accountStatus: "active",
          emailVerified: googleUser.emailVerified,
        });
      } else {
        await setDoc(userRef, {
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profileImage: googleUser.photoURL || userSnap.data()?.profileImage || ""
        }, { merge: true });
      }

      setSuccessText(isSignUp ? "Account created with Google" : "Signed in with Google");
      resetFailedAttempts();
      setTimeout(() => {
        setIsScanning(false);
        onSuccessLogin(googleUser.displayName || "Google Agronomist");
      }, 1000);
    } catch (err: any) {
      setIsScanning(false);
      setErrorText(err.message || "Google authentication failed.");
    }
  };

  const validateRegistration = () => {
    if (!fullName.trim()) return "Full name is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain a number.";
    if (!/[!@#$%^&*()_+\-=]/.test(password)) return "Password must contain a special character.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setSuccessText(null);

    const remaining = getRemainingLockoutTime();
    if (remaining > 0) {
      setErrorText(`Action disabled. Please wait ${remaining} seconds.`);
      return;
    }

    if (isSignUp) {
      const validationError = validateRegistration();
      if (validationError) {
        setErrorText(validationError);
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setErrorText("Email and password are required.");
        return;
      }
    }
    
    setIsScanning(true);
    try {
      if (isSignUp) {
        // Register in Cloud SQL first to perform server-side validation and database storage
        try {
          const regRes = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, password })
          });
          if (regRes.ok) {
            // Success
          } else if (regRes.status !== 404 && regRes.status !== 405) {
            const regData = await regRes.json();
            throw new Error(regData.error || "Failed to register with Cloud SQL.");
          } else {
             console.warn("Cloud SQL API unavailable (Vercel/Offline). Using Firebase fallback.");
          }
        } catch (serverErr: any) {
          if (serverErr.message.includes("Failed to register with Cloud SQL")) {
            throw serverErr;
          }
          console.warn("Cloud SQL registration bypassed:", serverErr.message);
        }

        // Successfully stored in Cloud SQL (or bypassed), now replicate in Firebase client for offline/realtime listeners
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(userCredential.user, { displayName: fullName.trim() });
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          fullName: fullName.trim(),
          role: "Farmer",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          profileImage: "",
          accountStatus: "active",
          emailVerified: false,
        });
      } else {
        // Authenticate with Cloud SQL first
        try {
          const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password })
          });
          if (loginRes.ok) {
            // Success
          } else if (loginRes.status !== 404 && loginRes.status !== 405) {
            const loginData = await loginRes.json();
            throw new Error(loginData.error || "Invalid email or password.");
          } else {
            console.warn("Cloud SQL API unavailable (Vercel/Offline). Using Firebase fallback.");
          }
        } catch (serverErr: any) {
           if (serverErr.message.includes("Invalid email") || serverErr.message.includes("disabled")) {
             throw serverErr;
           }
           console.warn("Cloud SQL login bypassed:", serverErr.message);
        }

        // Successfully verified in Cloud SQL (or bypassed), now sign in to Firebase client
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      
      setSuccessText(isSignUp ? "Registration Successful" : "Access Granted");
      resetFailedAttempts();
      
      setTimeout(() => {
        setIsScanning(false);
        onSuccessLogin(auth.currentUser?.displayName || "User");
      }, 1000);
      
    } catch (err: any) {
      handleFailedAttempt();
      setIsScanning(false);
      setErrorText(err.message || "Authentication failed.");
    }
  };

  const handleSendRecoveryCode = async (e: React.FormEvent) => {
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
      
      if (res.status === 404 || res.status === 405) {
        throw new Error("API_UNAVAILABLE");
      }
      
      const data = await res.json();
      if (res.ok) {
        setIsRecoveryCodeSent(true);
        if (data.emailSent) {
          setSuccessText("Secure 6-digit code dispatched to your email!");
        } else {
          setSuccessText("Code dispatched! (Dev Mode: Check terminal for the code)");
        }
      } else {
        setErrorText(data.error || "Failed to send code");
      }
    } catch (err: any) {
      if (err.message === "API_UNAVAILABLE" || err.message.includes("fetch")) {
        console.warn("Cloud SQL API unavailable (Vercel/Offline). Using Firebase fallback for password reset.");
        try {
          await sendPasswordResetEmail(auth, forgotEmail.trim());
          setSuccessText("Password reset link sent to your email by Firebase! Please check your inbox.");
        } catch (firebaseErr: any) {
          setErrorText(firebaseErr.message || "Failed to send recovery email.");
        }
      } else {
        setErrorText(err.message || "Network error");
      }
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
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-[0_0_80px_-15px_rgba(16,185,129,0.15)] relative overflow-hidden text-center">
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-6 right-6 p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="mb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl md:text-2xl font-mono font-bold text-white tracking-tight">
            {isForgotPassword ? "Secure Recovery" : isSignUp ? "System Registration" : "System Authorization"}
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-2 tracking-wide">
            {isForgotPassword 
              ? "Reset your AgroSensiX access credentials" 
              : isSignUp 
                ? "Create a new farm management profile" 
                : "Enter credentials to access farm telemetry"}
          </p>
        </div>

        <div className="space-y-4 relative z-10">
          {isForgotPassword ? (
            <div className="space-y-4">
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
                        className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none placeholder-zinc-805 tracking-widest text-center tracking-[0.5em]"
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorText(null);
                    setSuccessText(null);
                  }}
                  className="text-[10px] font-mono text-zinc-400 hover:text-emerald-400 uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-left">
              {isSignUp && (
                <div className="space-y-1.5 text-xs">
                  <label className="text-zinc-500 uppercase tracking-widest font-bold">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setErrorText(null);
                      }}
                      disabled={isScanning}
                      placeholder="Enter your full name"
                      className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none placeholder-zinc-800"
                    />
                    <User className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-xs">
                <label className="text-zinc-500 uppercase tracking-widest font-bold">Network Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorText(null);
                    }}
                    disabled={isScanning}
                    placeholder="agent@agrosensix.com"
                    className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none placeholder-zinc-800"
                  />
                  <Mail className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                </div>
              </div>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-500 uppercase tracking-widest font-bold">Passphrase</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrorText(null);
                        setSuccessText(null);
                      }}
                      className="text-[10px] text-emerald-500 hover:text-emerald-400 font-sans tracking-wide transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorText(null);
                    }}
                    disabled={isScanning}
                    placeholder="••••••••••••"
                    className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-10 text-xs text-zinc-200 focus:outline-none placeholder-zinc-800 tracking-widest"
                  />
                  <Lock className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5 text-xs">
                  <label className="text-zinc-500 uppercase tracking-widest font-bold">Confirm Passphrase</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrorText(null);
                      }}
                      disabled={isScanning}
                      placeholder="••••••••••••"
                      className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none placeholder-zinc-800 tracking-widest"
                    />
                    <Lock className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              )}

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
                disabled={isScanning || getRemainingLockoutTime() > 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-[#000] disabled:opacity-40 font-sans font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-lg tracking-wider text-xs active:scale-[0.98] mt-2"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#000]" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? "Register" : "Authorize"}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>
              
              <div className="py-2 flex items-center justify-center space-x-4">
                <div className="h-px bg-zinc-800 flex-1"></div>
                <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest font-bold">Or</span>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isScanning}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-sans font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer text-xs active:scale-[0.98]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
                </svg>
                <span>{isSignUp ? "Sign up with Google" : "Sign in with Google"}</span>
              </button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorText(null);
                    setSuccessText(null);
                  }}
                  className="text-[10px] font-mono text-zinc-400 hover:text-emerald-400 uppercase tracking-widest transition-colors cursor-pointer"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
