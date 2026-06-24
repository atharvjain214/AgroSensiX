import React, { useState } from "react";
import { 
  RefreshCw, 
  Key, 
  ArrowRight, 
  Sprout, 
  ShieldCheck, 
  Droplets, 
  Layers, 
  Sun, 
  Globe,
  Mail,
  User,
  Eye,
  EyeOff
} from "lucide-react";

interface LoginViewProps {
  onSuccessLogin: (userName: string) => void;
  onCancel?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccessLogin, onCancel }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [activeStat, setActiveStat] = useState<number | null>(null);

  // Login attempt protection states
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    const cached = localStorage.getItem("agrosensix_failed_attempts");
    return cached ? parseInt(cached, 10) : 0;
  });
  
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    const cached = localStorage.getItem("agrosensix_lockout_until");
    return cached ? parseInt(cached, 10) : 0;
  });

  const getRemainingLockoutTime = (): number => {
    const now = Date.now();
    if (lockoutUntil > now) {
      return Math.ceil((lockoutUntil - now) / 1000);
    }
    return 0;
  };

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

  const validateRegistration = () => {
    if (!fullName.trim()) return "Full name is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain a number.";
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
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp 
        ? { fullName: fullName.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }
      
      setSuccessText(isSignUp ? "Registration Successful" : "Access Granted");
      resetFailedAttempts();
      
      // Store token
      localStorage.setItem("agrosensix_auth_token", data.token);
      
      setTimeout(() => {
        setIsScanning(false);
        onSuccessLogin(data.user.fullName || "User");
      }, 1000);
      
    } catch (err: any) {
      handleFailedAttempt();
      setIsScanning(false);
      setErrorText(err.message || "Authentication failed.");
    }
  };

  const impactStats = [
    {
      id: 1,
      num: "1.2M+",
      label: "Water Saved",
      detail: "Gallons saved across high-precision automated drip networks.",
      icon: Droplets,
      color: "text-cyan-400",
      bgClass: "bg-cyan-500/10 border-cyan-500/20"
    },
    {
      id: 2,
      num: "450+",
      label: "Acres Monitored",
      detail: "Active high-yield orchards and multi-span green houses globally.",
      icon: Layers,
      color: "text-emerald-400",
      bgClass: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: 3,
      num: "12,800+",
      label: "Irrigation Runs",
      detail: "Closed-loop, automatic soil transpiration micro-pulses.",
      icon: Sprout,
      color: "text-emerald-350",
      bgClass: "bg-emerald-450/10 border-emerald-450/20"
    },
    {
      id: 4,
      num: "34.2K+",
      label: "kWh Solar Run",
      detail: "Eco energy produced via standalone hardware panel backups.",
      icon: Sun,
      color: "text-amber-400",
      bgClass: "bg-amber-500/10 border-amber-500/20"
    }
  ];

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 relative">
      <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[10%] w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[110px] pointer-events-none" />

      <div id="login-framework-card" className="max-w-5xl w-full bg-[#040c14]/80 backdrop-blur-3xl border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col lg:flex-row animate-fade-in text-left">
        
        {/* LEFT COLUMN */}
        <div className="lg:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col justify-between bg-gradient-to-br from-emerald-950/20 via-zinc-950/60 to-[#020910] border-b lg:border-b-0 lg:border-r border-zinc-900 relative">
          <div className="absolute inset-0 bg-[#02231b]/5 opacity-20 bg-[linear-gradient(to_right,rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.08)]">
                <Sprout className="w-5.5 h-5.5 shrink-0" />
              </div>
              <div>
                <span className="font-sans text-sm font-black tracking-widest text-zinc-100 uppercase block">
                  AGROSENSIX
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block tracking-widest mt-1">
                  Smart Farming OS
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-sans font-black tracking-tight text-white leading-tight">
                Smarter Farming <br className="hidden md:inline" />Starts Here
              </h1>
              <p className="text-zinc-400 text-sm md:text-base font-sans font-medium leading-relaxed max-w-md">
                Monitor crops. Save water. Protect harvests. Powered by AI.
              </p>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
                Platform Impact Statistics
              </span>
              <div className="grid grid-cols-2 gap-3.5">
                {impactStats.map((stat) => {
                  const Icon = stat.icon;
                  const isActive = activeStat === stat.id;
                  return (
                    <div 
                      key={stat.id}
                      onMouseEnter={() => setActiveStat(stat.id)}
                      onMouseLeave={() => setActiveStat(null)}
                      className={`p-4 rounded-2xl border transition-all duration-300 relative cursor-default ${
                        isActive 
                        ? `${stat.bgClass} scale-[1.02] shadow-lg` 
                        : "bg-zinc-950/40 border-zinc-900/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xl font-bold font-mono ${stat.color}`}>{stat.num}</span>
                        <Icon className={`w-4 h-4 ${isActive ? stat.color : "text-zinc-600"} transition-colors`} />
                      </div>
                      <p className="text-[10.5px] font-sans font-bold text-zinc-300 uppercase tracking-wide mt-1.5 leading-none">{stat.label}</p>
                      <p className={`text-[9.5px] font-sans text-zinc-500 leading-tight mt-1 transition-all ${isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
                        {stat.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col justify-between space-y-8 bg-zinc-950/30">
          
          <div className="space-y-6">
            <div className="text-left">
              {onCancel && (
                <button 
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center gap-1.5 text-[9.5px] font-mono text-zinc-520 hover:text-white uppercase transition-colors mb-6 cursor-pointer"
                >
                  ← Back to main overview
                </button>
              )}
              <span className="text-[9.5px] font-mono text-[#06b6d4] uppercase tracking-widest font-black block">
                {isSignUp ? "Account Registration" : "Command Station Access"}
              </span>
              <p className="text-xs text-zinc-500 mt-1.5 font-sans font-medium">
                {isSignUp 
                  ? "Create your securely encrypted farmer profile." 
                  : "Verify identity credentials to unlock manual controls."}
              </p>
            </div>

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
                      placeholder="Jane Doe"
                      className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none placeholder-zinc-805"
                    />
                    <User className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-xs">
                <label className="text-zinc-500 uppercase tracking-widest font-bold">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorText(null);
                    }}
                    disabled={isScanning}
                    placeholder="farmer@example.com"
                    className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none placeholder-zinc-805"
                  />
                  <Mail className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-500 uppercase tracking-widest font-bold">Security Passphrase</label>
                  {!isSignUp && (
                    <button type="button" className="text-[9px] text-zinc-500 hover:text-emerald-400 uppercase font-semibold cursor-pointer transition-colors">
                      Forgot?
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
                    placeholder="Enter security access key"
                    className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-10 text-xs text-zinc-200 focus:outline-none placeholder-zinc-805"
                  />
                  <Key className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-600 hover:text-zinc-400 cursor-pointer"
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
                      placeholder="Confirm security access key"
                      className="w-full bg-neutral-950 border border-zinc-900 focus:border-emerald-500/40 rounded-xl py-3 pl-10 pr-10 text-xs text-zinc-200 focus:outline-none placeholder-zinc-805"
                    />
                    <Key className="w-4 h-4 text-zinc-700 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              )}

              {/* Status messages blocks */}
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
                    <span>Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? "Register Account" : "Execute Access Login"}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>
            </form>
            
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
          </div>

          <div className="flex items-start gap-2.5 border-t border-zinc-900/80 pt-5 text-[9px] font-mono text-zinc-550 uppercase tracking-tight font-semibold leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-450 shrink-0 mt-0.5" />
            <span>Encrypted transmission. Passwords are hashed via bcrypt. Sessions are authorized in strict alignment with agricultural security guidelines.</span>
          </div>

        </div>

      </div>
    </div>
  );
};
