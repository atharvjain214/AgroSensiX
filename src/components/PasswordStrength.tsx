import React from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const reqs = [
    { id: "length", label: "Minimum 8 characters", valid: password.length >= 8 },
    { id: "uppercase", label: "Uppercase character", valid: /[A-Z]/.test(password) },
    { id: "lowercase", label: "Lowercase character", valid: /[a-z]/.test(password) },
    { id: "number", label: "Numeric character", valid: /[0-9]/.test(password) },
    { id: "special", label: "Special character", valid: /[!@#$%^&*()_+\-=]/.test(password) },
  ];

  const validCount = reqs.filter(r => r.valid).length;
  const totalCount = reqs.length;
  
  // 0-1: Very Weak, 2: Weak, 3: Moderate, 4: Strong, 5: Very Strong
  let strengthScore = 0;
  if (validCount === 0) strengthScore = 0;
  else if (validCount === 1) strengthScore = 20;
  else if (validCount === 2) strengthScore = 40;
  else if (validCount === 3) strengthScore = 60;
  else if (validCount === 4) strengthScore = 80;
  else if (validCount === 5) strengthScore = 100;

  let strengthLabel = "Very Weak";
  let barColor = "bg-red-800";
  let textColor = "text-red-700";

  if (strengthScore <= 20) {
    strengthLabel = "Very Weak";
    barColor = "bg-red-700";
    textColor = "text-red-500";
  } else if (strengthScore <= 40) {
    strengthLabel = "Weak";
    barColor = "bg-orange-600";
    textColor = "text-orange-500";
  } else if (strengthScore <= 60) {
    strengthLabel = "Moderate";
    barColor = "bg-orange-400";
    textColor = "text-orange-400";
  } else if (strengthScore <= 80) {
    strengthLabel = "Strong";
    barColor = "bg-green-400";
    textColor = "text-green-400";
  } else {
    strengthLabel = "Very Strong";
    barColor = "bg-green-500";
    textColor = "text-green-500";
  }

  // Suggestions
  const suggestions = [];
  if (!reqs.find(r => r.id === "length")?.valid) suggestions.push("Password is too short.");
  if (!reqs.find(r => r.id === "uppercase")?.valid) suggestions.push("Add an uppercase letter.");
  if (!reqs.find(r => r.id === "lowercase")?.valid) suggestions.push("Add a lowercase letter.");
  if (!reqs.find(r => r.id === "number")?.valid) suggestions.push("Add a number.");
  if (!reqs.find(r => r.id === "special")?.valid) suggestions.push("Add a special character.");

  return (
    <div className="w-full mt-3 space-y-3 p-4 bg-zinc-950/50 rounded-xl border border-zinc-900">
      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
        <span className="text-zinc-400">Password Strength</span>
        <span className={`${textColor}`}>{strengthLabel} ({strengthScore}%)</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-300 ease-out`} 
          style={{ width: `${strengthScore}%` }} 
        />
      </div>

      {/* Requirements List */}
      <div className="grid grid-cols-1 gap-2 pt-1">
        {reqs.map((req) => (
          <div key={req.id} className="flex items-center gap-2 text-xs">
            {req.valid ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <X className="w-4 h-4 text-red-500" />
            )}
            <span className={req.valid ? "text-zinc-400" : "text-zinc-600"}>
              {req.label}
            </span>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && password.length > 0 && (
        <div className="pt-2 border-t border-zinc-900/50">
          <p className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase mb-1">Suggestions:</p>
          <ul className="text-xs text-orange-400/80 space-y-1 list-disc list-inside">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
