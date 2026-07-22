import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Send, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Info, 
  LogOut, 
  PlusCircle, 
  User, 
  Filter, 
  Cpu, 
  Zap, 
  Droplets,
  Terminal,
  FileText
} from "lucide-react";
import { connectGmail, disconnectGmail, getCachedAccessToken } from "../utils/workspaceAuth";
import { SectorData, BatteryTelemetry, WaterPumpTelemetry } from "../types";
import { auth } from "../firebase";

interface GmailViewProps {
  sectors: SectorData[];
  battery: BatteryTelemetry;
  pump: WaterPumpTelemetry;
}

interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

export const GmailView: React.FC<GmailViewProps> = ({ sectors, battery, pump }) => {
  // Connection states
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return localStorage.getItem("agrosensix_gmail_connected") === "true" && getCachedAccessToken() !== null;
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);

  // Configuration for automated alerts
  const [alertRecipients, setAlertRecipients] = useState<string>(() => {
    return localStorage.getItem("agrosensix_alert_recipients") || "";
  });
  const [enableMoistureAlert, setEnableMoistureAlert] = useState<boolean>(() => {
    return localStorage.getItem("agrosensix_alert_moisture") !== "false";
  });
  const [enableBatteryAlert, setEnableBatteryAlert] = useState<boolean>(() => {
    return localStorage.getItem("agrosensix_alert_battery") !== "false";
  });
  const [enableReservoirAlert, setEnableReservoirAlert] = useState<boolean>(() => {
    return localStorage.getItem("agrosensix_alert_reservoir") !== "false";
  });

  // Composer states
  const [toField, setToField] = useState("");
  const [subjectField, setSubjectField] = useState("");
  const [bodyField, setBodyField] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Inbox list states
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("subject:AgroSensiX OR \"farm\" OR \"crop\"");

  // Initialize connection state on load
  useEffect(() => {
    const token = getCachedAccessToken();
    const firebaseUser = auth.currentUser;
    
    if (token && firebaseUser) {
      setIsConnected(true);
      setUserEmail(firebaseUser.email);
      setUserName(firebaseUser.displayName || "AgroSensiX Coordinator");
      setUserPhoto(firebaseUser.photoURL);
      if (!toField) {
        setToField(firebaseUser.email || "");
      }
      if (!alertRecipients) {
        setAlertRecipients(firebaseUser.email || "");
      }
    } else {
      setIsConnected(false);
    }
  }, []);

  // Save configurations on modification
  useEffect(() => {
    localStorage.setItem("agrosensix_alert_recipients", alertRecipients);
  }, [alertRecipients]);

  useEffect(() => {
    localStorage.setItem("agrosensix_alert_moisture", String(enableMoistureAlert));
  }, [enableMoistureAlert]);

  useEffect(() => {
    localStorage.setItem("agrosensix_alert_battery", String(enableBatteryAlert));
  }, [enableBatteryAlert]);

  useEffect(() => {
    localStorage.setItem("agrosensix_alert_reservoir", String(enableReservoirAlert));
  }, [enableReservoirAlert]);

  // Connect handler
  const handleConnect = async () => {
    setIsConnecting(true);
    setConnError(null);
    try {
      const res = await connectGmail();
      if (res) {
        setIsConnected(true);
        setUserEmail(res.user.email);
        setUserName(res.user.displayName || "AgroSensiX Coordinator");
        setUserPhoto(res.user.photoURL);
        
        if (!toField && res.user.email) {
          setToField(res.user.email);
        }
        if (!alertRecipients && res.user.email) {
          setAlertRecipients(res.user.email);
        }
        
        // Refresh inbox upon successful connection
        fetchInboxMessages(res.accessToken);
      }
    } catch (err: any) {
      setConnError(err?.message || "Failed to establish secure Gmail connection.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect handler
  const handleDisconnect = () => {
    disconnectGmail();
    setIsConnected(false);
    setUserEmail(null);
    setUserName(null);
    setUserPhoto(null);
    setMessages([]);
  };

  // Base64url encode helper to adhere strictly to Gmail RFC 822 format requirement
  const b64EncodeUnicode = (str: string): string => {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  // Send email logic using the Gmail REST API
  const handleSendEmail = async (e?: React.FormEvent, customTo?: string, customSubject?: string, customBody?: string) => {
    if (e) e.preventDefault();
    
    const token = getCachedAccessToken();
    if (!token) {
      setSendStatus({ success: false, message: "Authentication expired. Please reconnect Gmail." });
      return;
    }

    const recipient = customTo || toField;
    const subject = customSubject || subjectField;
    const body = customBody || bodyField;

    if (!recipient.trim() || !subject.trim() || !body.trim()) {
      setSendStatus({ success: false, message: "Please fill out all email fields." });
      return;
    }

    // Explicit confirmation dialog for all modifying/sending actions
    const isConfirmed = window.confirm(
      `Confirm email dispatch to ${recipient}?\nSubject: ${subject}`
    );
    if (!isConfirmed) return;

    setIsSending(true);
    setSendStatus(null);

    try {
      const emailLines = [
        `To: ${recipient}`,
        `Subject: ${subject}`,
        "Content-Type: text/html; charset=utf-8",
        "MIME-Version: 1.0",
        "",
        body.replace(/\n/g, "<br />")
      ];
      const rawMsg = b64EncodeUnicode(emailLines.join("\r\n"));

      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: rawMsg })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || "Gmail API returned sending error.");
      }

      setSendStatus({ success: true, message: "Report successfully dispatched via Gmail!" });
      
      // Clear composer if it wasn't an automated test send
      if (!customTo) {
        setSubjectField("");
        setBodyField("");
      }
      
      // Refresh inbox list to reflect the sent mail
      fetchInboxMessages(token);
    } catch (err: any) {
      setSendStatus({ success: false, message: err?.message || "Failed to dispatch email." });
    } finally {
      setIsSending(false);
    }
  };

  // Generate automated agronomist report body
  const generateTelemetryReport = () => {
    const reportTime = new Date().toLocaleString();
    let sectorListHTML = "";
    
    sectors.forEach(s => {
      let nodeHTML = "";
      s.nodes.forEach(n => {
        const isDry = n.soilMoisture < s.moistureThresholdMin;
        nodeHTML += `
          <tr style="border-bottom: 1px solid #2d2d30;">
            <td style="padding: 6px 0; color: #e4e4e7; font-size: 11px;">${n.name}</td>
            <td style="padding: 6px 0; font-size: 11px; color: ${isDry ? '#f87171' : '#34d399'}">${n.soilMoisture}% VWC</td>
            <td style="padding: 6px 0; color: #a1a1aa; font-size: 11px;">${n.temperature}°C</td>
            <td style="padding: 6px 0; font-size: 10px; color: ${n.status === 'nominal' ? '#34d399' : '#fbbf24'}">${n.status.toUpperCase()}</td>
          </tr>
        `;
      });

      sectorListHTML += `
        <div style="background-color: #18181b; border: 1px solid #27272a; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #10b981; font-size: 13px;">Sector: ${s.name} (${s.cropType})</h4>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #a1a1aa;">Plant Health Index: <strong>${s.plantHealthIndex}/100</strong></p>
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid #3f3f46; color: #71717a; font-size: 10px;">
                <th style="padding-bottom: 4px;">Node ID</th>
                <th style="padding-bottom: 4px;">Moisture</th>
                <th style="padding-bottom: 4px;">Temp</th>
                <th style="padding-bottom: 4px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${nodeHTML}
            </tbody>
          </table>
        </div>
      `;
    });

    const reportHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; padding: 24px; border-radius: 12px; border: 1px solid #18181b;">
        <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; color: #10b981;">AgroSensiX Intelligence Dispatch</h2>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1.5px;">Smart Farm Ecological Report</p>
        </div>
        
        <p style="font-size: 12px; color: #a1a1aa;">Generated on: <strong>${reportTime}</strong></p>
        
        <h3 style="color: #e4e4e7; border-left: 3px solid #10b981; padding-left: 8px; font-size: 14px;">1. Telemetry Highlights</h3>
        <table style="width: 100%; font-size: 12px; margin-bottom: 16px;">
          <tr>
            <td style="color: #71717a;">Solar Storage battery:</td>
            <td style="text-align: right; color: #e4e4e7;"><strong>${battery.chargePercent}%</strong> (${battery.chargingState.toUpperCase()})</td>
          </tr>
          <tr>
            <td style="color: #71717a;">Water Reservoir:</td>
            <td style="text-align: right; color: #e4e4e7;"><strong>${pump.reservoirLevelPercent}% capacity</strong></td>
          </tr>
          <tr>
            <td style="color: #71717a;">Water Pump Mode:</td>
            <td style="text-align: right; color: #e4e4e7;"><strong>${pump.currentMode.toUpperCase()}</strong> (${pump.status})</td>
          </tr>
          <tr>
            <td style="color: #71717a;">Active Pump Flow:</td>
            <td style="text-align: right; color: #e4e4e7;"><strong>${pump.flowRateLpm} LPM</strong></td>
          </tr>
        </table>

        <h3 style="color: #e4e4e7; border-left: 3px solid #10b981; padding-left: 8px; font-size: 14px; margin-bottom: 12px;">2. Sector Profiles</h3>
        ${sectorListHTML}

        <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #18181b; text-align: center; font-size: 10px; color: #71717a;">
          <p>This report was dispatched automatically from the AgroSensiX Local Farm Node Gateway.</p>
          <p>© 2026 AgroSensiX Agricultural OS. All rights reserved.</p>
        </div>
      </div>
    `;

    setSubjectField(`AgroSensiX Ecological Telemetry Report - ${new Date().toLocaleDateString()}`);
    setBodyField(reportHTML);
  };

  // Send an immediate test report
  const handleSendTestReport = () => {
    if (!alertRecipients.trim()) {
      alert("Please provide an alert recipient email first.");
      return;
    }

    const reportTime = new Date().toLocaleString();
    let sectorListHTML = "";
    
    sectors.forEach(s => {
      let nodeHTML = "";
      s.nodes.forEach(n => {
        const isDry = n.soilMoisture < s.moistureThresholdMin;
        nodeHTML += `
          <tr style="border-bottom: 1px solid #2d2d30;">
            <td style="padding: 6px 0; color: #e4e4e7; font-size: 11px;">${n.name}</td>
            <td style="padding: 6px 0; font-size: 11px; color: ${isDry ? '#f87171' : '#34d399'}">${n.soilMoisture}% VWC</td>
            <td style="padding: 6px 0; color: #a1a1aa; font-size: 11px;">${n.temperature}°C</td>
          </tr>
        `;
      });

      sectorListHTML += `
        <div style="background-color: #18181b; border: 1px solid #27272a; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #10b981; font-size: 13px;">Sector: ${s.name}</h4>
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid #3f3f46; color: #71717a; font-size: 10px;">
                <th style="padding-bottom: 4px;">Node</th>
                <th style="padding-bottom: 4px;">Moisture</th>
                <th style="padding-bottom: 4px;">Temp</th>
              </tr>
            </thead>
            <tbody>
              ${nodeHTML}
            </tbody>
          </table>
        </div>
      `;
    });

    const bodyHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; padding: 24px; border-radius: 12px; border: 1px solid #18181b;">
        <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; color: #10b981;">⚠️ AgroSensiX Test Alert Notification</h2>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">Diagnostics Email Verification</p>
        </div>
        
        <p style="font-size: 12px; color: #a1a1aa;">Dispatched at: <strong>${reportTime}</strong></p>
        
        <p style="font-size: 13px; color: #e4e4e7;">This is a verification test to confirm your AgroSensiX Gmail integration works flawlessly. The active telemetry values of your farming nodes are summarized below:</p>

        <h3 style="color: #e4e4e7; border-left: 3px solid #10b981; padding-left: 8px; font-size: 14px;">Telemetry Snap</h3>
        <table style="width: 100%; font-size: 12px; margin-bottom: 16px;">
          <tr>
            <td style="color: #71717a;">Battery:</td>
            <td style="text-align: right; color: #e4e4e7;"><strong>${battery.chargePercent}%</strong></td>
          </tr>
          <tr>
            <td style="color: #71717a;">Reservoir Level:</td>
            <td style="text-align: right; color: #e4e4e7;"><strong>${pump.reservoirLevelPercent}%</strong></td>
          </tr>
        </table>

        ${sectorListHTML}

        <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #18181b; text-align: center; font-size: 10px; color: #71717a;">
          <p>Dispatched from impactful-citron-7skkt server.</p>
        </div>
      </div>
    `;

    handleSendEmail(
      undefined,
      alertRecipients,
      `[AgroSensiX Verified] Diagnostics Telemetry Snapshot`,
      bodyHTML
    );
  };

  // Fetch Inbox Messages using Gmail list/get endpoints
  const fetchInboxMessages = async (explicitToken?: string) => {
    const token = explicitToken || getCachedAccessToken();
    if (!token) return;

    setIsLoadingMessages(true);
    setInboxError(null);

    try {
      // List message headers
      const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8&q=${encodeURIComponent(searchQuery)}`;
      const listResponse = await fetch(listUrl, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!listResponse.ok) {
        if (listResponse.status === 401 || listResponse.status === 403) {
          handleDisconnect();
          throw new Error("Access token expired or missing scopes. Disconnected. Please reconnect.");
        }
        throw new Error("Failed to scan mailbox list via Gmail API.");
      }

      const listData = await listResponse.json();
      if (!listData.messages || listData.messages.length === 0) {
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      // Fetch message details in parallel
      const detailPromises = listData.messages.map(async (msg: { id: string }) => {
        const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
        const detailRes = await fetch(detailUrl, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!detailRes.ok) return null;
        return detailRes.json();
      });

      const detailedMessages = await Promise.all(detailPromises);
      
      const parsedMessages: GmailMessage[] = detailedMessages
        .filter(d => d !== null)
        .map((m: any) => {
          const headers = m.payload?.headers || [];
          const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject");
          const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from");
          const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date");

          return {
            id: m.id,
            subject: subjectHeader ? subjectHeader.value : "(No Subject)",
            from: fromHeader ? fromHeader.value : "Unknown Sender",
            date: dateHeader ? new Date(dateHeader.value).toLocaleDateString() : "Unknown Date",
            snippet: m.snippet || ""
          };
        });

      setMessages(parsedMessages);
    } catch (err: any) {
      setInboxError(err?.message || "Error scanning mailbox. Please reconnect.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Poll inbox messages on load if connected
  useEffect(() => {
    if (isConnected) {
      fetchInboxMessages();
    }
  }, [isConnected]);

  return (
    <div className="space-y-6 text-left" id="gmail-view-container">
      {/* Visual Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-sans font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-emerald-400" />
            Workspace Email Center
          </h1>
          <p className="text-xs md:text-sm font-mono text-zinc-500 mt-1 uppercase tracking-widest font-semibold">
            Google Gmail Telemetry Gateway & Intelligent Advisories
          </p>
        </div>

        {isConnected && (
          <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-900 px-4 py-2 rounded-xl">
            {userPhoto ? (
              <img src={userPhoto} alt={userName || ""} className="w-7 h-7 rounded-full border border-emerald-500/20" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="text-left font-mono">
              <p className="text-[10px] font-bold text-zinc-300 leading-none truncate max-w-[150px]">{userName}</p>
              <p className="text-[9px] text-emerald-400 tracking-wide font-medium mt-0.5 truncate max-w-[150px]">{userEmail}</p>
            </div>
            <button 
              onClick={handleDisconnect}
              className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-500/10 rounded-lg transition-all ml-2 cursor-pointer"
              title="Disconnect Gmail Account"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="max-w-xl mx-auto rounded-2xl border border-zinc-900 bg-zinc-950/45 p-6 md:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto shadow-inner animate-pulse">
            <Mail className="w-7 h-7" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-sans font-bold text-zinc-100">Connect Google Workspace</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Unlock the power of automated email notifications and smart report dispatch. Authorized through secure Google Sign-in to communicate with your nodes.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900/60 rounded-xl p-4 text-left max-w-md mx-auto space-y-3 font-mono text-[10px] text-zinc-500">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              <span>Integration Capabilities</span>
            </div>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Automatic warning notifications for dry soil and telemetry gaps.</li>
              <li>Instantly compile and email detailed agronomist crop-health drafts.</li>
              <li>Scan and filter inbox notifications matching critical farm alerts.</li>
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center pt-2">
            <button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="gsi-material-button cursor-pointer relative transition-transform active:scale-95 duration-200"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-sans text-xs">Sign in with Google</span>
              </div>
            </button>
            {isConnecting && (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mt-4">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Contacting Authorization project...</span>
              </div>
            )}
            {connError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs font-mono mt-4">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{connError}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: CONFIGURATIONS & COMPOSER (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. AUTOMATED EMAIL ALERTS SETTINGS */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/45 p-4.5 md:p-6 shadow-xl relative backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wide">
                  Automated Farm Alert Configuration
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1.5">
                    Alert Receiver Email
                  </label>
                  <input 
                    type="email"
                    value={alertRecipients}
                    onChange={(e) => setAlertRecipients(e.target.value)}
                    placeholder="e.g., manager@farm.com"
                    className="w-full bg-zinc-900/50 border border-zinc-900 text-xs font-bold text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500/30 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <label className="flex items-center gap-3 p-3 bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-900/50 rounded-xl cursor-pointer transition-all">
                    <input 
                      type="checkbox"
                      checked={enableMoistureAlert}
                      onChange={(e) => setEnableMoistureAlert(e.target.checked)}
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <div>
                      <p className="text-xs font-sans font-bold text-zinc-200">Moisture Alerts</p>
                      <p className="text-[9px] font-mono text-zinc-500 mt-0.5">Moisture &lt; limit</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-900/50 rounded-xl cursor-pointer transition-all">
                    <input 
                      type="checkbox"
                      checked={enableBatteryAlert}
                      onChange={(e) => setEnableBatteryAlert(e.target.checked)}
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <div>
                      <p className="text-xs font-sans font-bold text-zinc-200">Power Alerts</p>
                      <p className="text-[9px] font-mono text-zinc-500 mt-0.5">Battery &lt; 20%</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-900/50 rounded-xl cursor-pointer transition-all">
                    <input 
                      type="checkbox"
                      checked={enableReservoirAlert}
                      onChange={(e) => setEnableReservoirAlert(e.target.checked)}
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <div>
                      <p className="text-xs font-sans font-bold text-zinc-200">Reservoir Alerts</p>
                      <p className="text-[9px] font-mono text-zinc-500 mt-0.5">Level &lt; 15%</p>
                    </div>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-900/60">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                    <Info className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Background checks active on sensor shifts.</span>
                  </div>
                  <button
                    onClick={handleSendTestReport}
                    disabled={isSending}
                    className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] duration-200"
                  >
                    <Send className="w-3 h-3" />
                    Dispatch Verification Snapshot
                  </button>
                </div>
              </div>
            </div>

            {/* 2. RICH FARM EMAIL COMPOSER */}
            <form onSubmit={(e) => handleSendEmail(e)} className="rounded-2xl border border-zinc-900 bg-zinc-950/45 p-4.5 md:p-6 shadow-xl relative backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wide">
                    Crop Health Email Dispatcher
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={generateTelemetryReport}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  COMPILE LIVE TELEMETRY
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">
                    To Recipient
                  </label>
                  <input 
                    type="email"
                    required
                    value={toField}
                    onChange={(e) => setToField(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full bg-zinc-900/50 border border-zinc-900 text-xs font-bold text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">
                    Subject Line
                  </label>
                  <input 
                    type="text"
                    required
                    value={subjectField}
                    onChange={(e) => setSubjectField(e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full bg-zinc-900/50 border border-zinc-900 text-xs font-bold text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">
                  Email Content Body
                </label>
                <textarea 
                  required
                  rows={8}
                  value={bodyField}
                  onChange={(e) => setBodyField(e.target.value)}
                  placeholder="Enter message text. You can compile current farm statuses directly using the button above."
                  className="w-full bg-zinc-900/50 border border-zinc-900 text-xs font-bold text-zinc-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500/30 font-mono resize-y"
                />
              </div>

              {sendStatus && (
                <div className={`p-3 rounded-xl text-xs font-mono border flex items-center gap-2 ${
                  sendStatus.success 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {sendStatus.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  <span>{sendStatus.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02] duration-200"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Email Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>

          {/* RIGHT PANEL: RECENT CORRESPONDENCE INBOX (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/45 p-4 md:p-5 shadow-xl relative backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4.5 h-4.5 text-emerald-400" />
                  <h2 className="text-xs font-sans font-bold text-zinc-100 uppercase tracking-wide">
                    Farm Alert Inbox
                  </h2>
                </div>
                <button 
                  onClick={() => fetchInboxMessages()}
                  disabled={isLoadingMessages}
                  className="p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer text-zinc-500 hover:text-emerald-400"
                  title="Force Sync Mailbox"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? "animate-spin text-emerald-400" : ""}`} />
                </button>
              </div>

              {/* Advanced filter text box */}
              <div className="mb-4">
                <label className="block text-[9px] font-mono text-zinc-650 uppercase font-bold mb-1">
                  Inbox Filter Rule
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchInboxMessages();
                    }}
                    placeholder="Search queries"
                    className="w-full bg-zinc-900/30 border border-zinc-900 text-[9px] font-bold text-zinc-300 pl-2.5 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500/30 font-mono"
                  />
                  <button 
                    onClick={() => fetchInboxMessages()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300"
                  >
                    <Filter className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {isLoadingMessages ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-zinc-500">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  <p className="text-[10px] font-mono uppercase tracking-widest">Querying Gmail inbox...</p>
                </div>
              ) : inboxError ? (
                <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl text-center space-y-2">
                  <AlertTriangle className="w-5 h-5 text-zinc-600 mx-auto" />
                  <p className="text-[10px] font-mono text-zinc-500 leading-normal">{inboxError}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-zinc-600 space-y-1.5">
                  <Mail className="w-5 h-5 mx-auto text-zinc-700" />
                  <p className="text-[10px] font-mono uppercase tracking-widest">No Alerts Detected</p>
                  <p className="text-[9px] text-zinc-500 leading-normal max-w-[180px] mx-auto">No emails matched current AgroSensiX query rule.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                  {messages.map((m) => (
                    <div 
                      key={m.id}
                      className="p-3 bg-zinc-900/25 hover:bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850/60 rounded-xl transition-all text-left"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[120px]">{m.from.split("<")[0] || m.from}</span>
                        <span className="text-[8px] font-mono text-zinc-600 shrink-0">{m.date}</span>
                      </div>
                      <h4 className="text-xs font-sans font-bold text-zinc-200 line-clamp-1">{m.subject}</h4>
                      <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 mt-1">{m.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
