import { useState, useEffect } from "react";
import { NavigationPage, SectorData, BatteryTelemetry, WaterPumpTelemetry, SensorNode } from "./types";
import { mockSectors, mockBattery, mockPump } from "./mockData";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { onSnapshot, doc, collection } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { 
  seedDatabaseIfEmpty, 
  updateFirestoreSector, 
  updateFirestoreNode, 
  updateFirestoreBattery, 
  updateFirestorePump 
} from "./dbUtils";

// Import Custom Views
import { HomeView } from "./components/HomeView";
import { DashboardView } from "./components/DashboardView";
import { AnalyticsView } from "./components/AnalyticsView";
import { AiAssistantView } from "./components/AiAssistantView";
import { IrrigationView } from "./components/IrrigationView";
import { BlueprintView } from "./components/BlueprintView";
import { AboutView } from "./components/AboutView";
import { LoginView } from "./components/LoginView";
import { OfflineManager } from "./components/OfflineManager";
import { ImpactView } from "./components/ImpactView";
import { SettingsView } from "./components/SettingsView";
import { GmailView } from "./components/GmailView";
import { checkAndTriggerEmailAlerts } from "./utils/alertEngine";
import { offlineStorage } from "./utils/offlineStorage";

// Import Layout Icons
import { 
  Sprout, 
  LayoutDashboard, 
  LineChart, 
  Bot, 
  Mail,
  Sliders, 
  Code, 
  HelpCircle, 
  LogOut, 
  ShieldCheck, 
  Activity, 
  Calendar,
  Menu,
  X,
  Sun,
  Moon,
  Leaf,
  Wifi,
  WifiOff,
  Database,
  Droplets,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Globe,
  Cpu,
  BookOpen,
  Info,
  AlertOctagon
} from "lucide-react";

export default function App() {
  // Theme state defaulting to dark with local persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem("theme") as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    return localStorage.getItem("settings_sidebar_expanded") !== "false";
  });

  useEffect(() => {
    localStorage.setItem("settings_sidebar_expanded", isSidebarExpanded ? "true" : "false");
  }, [isSidebarExpanded]);

  // Authentication states linked directly with live Firebase Auth credentials and persistent caches
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    return localStorage.getItem("agrosensix_cached_user") || null;
  });
  const [isBypassMode, setIsBypassMode] = useState(() => {
    const cached = localStorage.getItem("agrosensix_cached_user");
    return cached === "Admin Agronomist" || cached === "Certified Agronomist" || cached === "Admin Farmer";
  });
  const [currentPage, setCurrentPage] = useState<NavigationPage>(NavigationPage.HOME);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Biological States populated in real-time from Firestore backhaul or offlineStorage fallbacks
  const [sectors, setSectors] = useState<SectorData[]>(() => {
    return offlineStorage.getSectors(mockSectors);
  });
  const [battery, setBattery] = useState<BatteryTelemetry>(() => {
    return offlineStorage.getBattery(mockBattery);
  });
  const [pump, setPump] = useState<WaterPumpTelemetry>(() => {
    return offlineStorage.getPump(mockPump);
  });

  // Network offline capabilities states and local fallbacks
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [forceOffline, setForceOffline] = useState(false);
  const isLocalOnly = isBypassMode || loggedInUser === "Admin Agronomist" || forceOffline || !isOnline;

  // Track the actual device browser network status
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Session timeout after 10 minutes of inactivity for startup-grade security
  useEffect(() => {
    if (!loggedInUser) return;

    let timeoutId: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // Timeout trigger after 10 mins (600,000 ms)
      timeoutId = setTimeout(() => {
        console.log("Inactivity limit reached. SECURE AUTO-LOGOUT TRIGGERED.");
        setIsBypassMode(false);
        setLoggedInUser(null);
        localStorage.removeItem("agrosensix_cached_user");
        setCurrentPage(NavigationPage.HOME);
        offlineStorage.addNotification(
          "Session Timeout",
          "Your administrative session has completed due to inactivity.",
          "info"
        );
      }, 600000);
    };

    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);
    window.addEventListener("scroll", resetInactivityTimer);

    resetInactivityTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      window.removeEventListener("click", resetInactivityTimer);
      window.removeEventListener("scroll", resetInactivityTimer);
    };
  }, [loggedInUser]);

  // Auto-update Offline Storage Caches on state updates for full offline reliability
  useEffect(() => {
    offlineStorage.saveSectors(sectors);
  }, [sectors]);

  useEffect(() => {
    offlineStorage.saveBattery(battery);
  }, [battery]);

  useEffect(() => {
    offlineStorage.savePump(pump);
  }, [pump]);

  // Silent background sync when internet becomes available
  useEffect(() => {
    if (isOnline && !forceOffline && loggedInUser) {
      console.log("Internet restored. Initiating silent background data synchronization...");
      const doSync = async () => {
        try {
          const result = await offlineStorage.syncLocalDataToCloud();
          if (result.successCount > 0) {
            offlineStorage.addNotification(
              "Cloud Sync Complete",
              `Successfully pushed ${result.successCount} pending offline changes to cloud database.`,
              "success"
            );
          }
        } catch (err) {
          console.warn("Background sync process had issues:", err);
        }
      };
      // Short delay for network stability
      const t = setTimeout(doSync, 2000);
      return () => clearTimeout(t);
    }
  }, [isOnline, forceOffline, loggedInUser]);

  // Live Timer clocks
  const [currentIstTime, setCurrentIstTime] = useState("");

  // Live clock updates in IST format
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).formatToParts(now);

        const partMap = new Map(parts.map(p => [p.type, p.value]));
        
        const weekday = partMap.get('weekday') || "";
        const day = partMap.get('day') || "";
        const month = partMap.get('month') || "";
        const year = partMap.get('year') || "";
        const hour = partMap.get('hour') || "";
        const minute = partMap.get('minute') || "";
        const second = partMap.get('second') || "";
        const dayPeriod = partMap.get('dayPeriod') || "";

        setCurrentIstTime(`${weekday}, ${day} ${month} ${year} ${hour}:${minute}:${second} ${dayPeriod} IST`);
      } catch (e) {
        // Fallback
        const fallback = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: true }) + " IST";
        setCurrentIstTime(fallback);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Custom JWT Session Auto-restoration
  useEffect(() => {
    const token = localStorage.getItem("agrosensix_auth_token");
    if (token) {
      // Verify token with backend
      fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(async data => {
        if (data.success && data.user) {
          setIsBypassMode(false);
          setLoggedInUser(data.user.fullName || data.user.email);
          localStorage.setItem("agrosensix_cached_user", data.user.fullName || data.user.email);
          
          if (!forceOffline && navigator.onLine) {
            await seedDatabaseIfEmpty();
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem("agrosensix_auth_token");
          if (!isLocalOnly) {
            setLoggedInUser(null);
            localStorage.removeItem("agrosensix_cached_user");
          }
        }
      })
      .catch(err => {
        console.error("Token verification failed:", err);
      });
    } else {
      if (!isLocalOnly) {
        setLoggedInUser(null);
      }
    }
  }, [isLocalOnly, forceOffline]);

  // Set up live Firestore realtime snapshot listeners to synchronize client views seamlessly
  useEffect(() => {
    if (!loggedInUser || isLocalOnly) return;

    // 1. Sync Central Battery storage metrics
    const unsubBattery = onSnapshot(doc(db, "telemetry", "battery"), (snap) => {
      if (snap.exists()) {
        setBattery(snap.data() as BatteryTelemetry);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "telemetry/battery");
    });

    // 2. Sync Water Pump telemetry operations
    const unsubPump = onSnapshot(doc(db, "telemetry", "pump"), (snap) => {
      if (snap.exists()) {
        setPump(snap.data() as WaterPumpTelemetry);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "telemetry/pump");
    });

    // 3. Sync Sectors and related Node configurations reactively
    const sectorIds = ["sector-G14", "sector-7G"];
    const activeUnsubscribes: (() => void)[] = [];
    const localSectorCache: Record<string, SectorData> = {};

    sectorIds.forEach((id) => {
      // Listener 3a: Track main sector metrics
      const unsubSec = onSnapshot(doc(db, "sectors", id), (snap) => {
        if (snap.exists()) {
          const rawSec = snap.data();
          localSectorCache[id] = {
            id: id,
            name: rawSec.name || "",
            cropType: rawSec.cropType || "",
            plantHealthIndex: rawSec.plantHealthIndex || 100,
            moistureThresholdMin: rawSec.moistureThresholdMin || 0,
            moistureThresholdMax: rawSec.moistureThresholdMax || 100,
            activeAlertsCount: rawSec.activeAlertsCount || 0,
            nodes: localSectorCache[id]?.nodes || []
          };
          // Push sorted array of cached sectors to React state
          setSectors(Object.values(localSectorCache).sort((a,b) => a.id.localeCompare(b.id)));
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `sectors/${id}`);
      });
      activeUnsubscribes.push(unsubSec);

      // Listener 3b: Track nodes subcollection in realtime
      const unsubNodes = onSnapshot(collection(db, "sectors", id, "nodes"), (snap) => {
        const nodesList: SensorNode[] = [];
        snap.forEach((docSnap) => {
          nodesList.push(docSnap.data() as SensorNode);
        });
        
        // Static layout ordering
        nodesList.sort((a, b) => a.id.localeCompare(b.id));

        if (localSectorCache[id]) {
          localSectorCache[id].nodes = nodesList;
        } else {
          localSectorCache[id] = {
            id: id,
            name: id === "sector-G14" ? "greenhouse sector G-14" : "bio-track sector 7G",
            cropType: "",
            plantHealthIndex: 100,
            moistureThresholdMin: 0,
            moistureThresholdMax: 100,
            activeAlertsCount: 0,
            nodes: nodesList
          };
        }
        
        setSectors(Object.values(localSectorCache).sort((a,b) => a.id.localeCompare(b.id)));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `sectors/${id}/nodes`);
      });
      activeUnsubscribes.push(unsubNodes);
    });

    return () => {
      unsubBattery();
      unsubPump();
      activeUnsubscribes.forEach((unsub) => unsub());
    };
  }, [loggedInUser, isLocalOnly]);

  // Background automated biosensor micro-fluctuations (keeps system looking alive local so we don't trigger massive DB write fees!)
  useEffect(() => {
    if (!loggedInUser) return;
    
    const interval = setInterval(() => {
      // Fluctuating moisture & temperatures slightly on screen for organic animation feel
      setSectors((prevSectors) => 
        prevSectors.map((sec) => ({
          ...sec,
          nodes: sec.nodes.map((node) => {
            const tempDelta = (Math.random() - 0.5) * 0.15;
            const moistureDelta = (Math.random() - 0.5) * 0.1;
            return {
              ...node,
              temperature: parseFloat((node.temperature + tempDelta).toFixed(1)),
              soilMoisture: parseFloat(Math.max(10, Math.min(100, node.soilMoisture + moistureDelta)).toFixed(1))
            };
          })
        }))
      );

      // Float battery charge metrics locally
      setBattery((prevBattery) => {
        const loadDelta = (Math.random() - 0.5) * 0.03;
        const currentLoad = Math.max(0.5, Math.min(3.0, prevBattery.loadKw + loadDelta));
        const chargeDelta = prevBattery.solarInputKw - currentLoad;
        const currentCharge = Math.max(10, Math.min(100, prevBattery.chargePercent + (chargeDelta * 0.01)));
        
        return {
          ...prevBattery,
          loadKw: parseFloat(currentLoad.toFixed(2)),
          chargePercent: parseFloat(currentCharge.toFixed(1))
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [loggedInUser]);

  // Automated email alert dispatcher on biosensor updates
  useEffect(() => {
    if (!loggedInUser) return;
    checkAndTriggerEmailAlerts(sectors, battery, pump);
  }, [sectors, battery, pump, loggedInUser]);

  // Automated pumping countdown timer if manual pulsing active
  useEffect(() => {
    if (pump.pulsingTimerSec > 0) {
      const timer = setTimeout(() => {
        const nextSec = pump.pulsingTimerSec - 1;
        
        if (nextSec <= 0) {
          const finishedUpdates = {
            status: "standby" as const,
            flowRateLpm: 0,
            pressureBar: 0,
            currentMode: "biological" as const,
            pulsingTimerSec: 0
          };
          if (!isLocalOnly) {
            try {
              // Finished pulse sequence, return pump to baseline idle standby state globally on DB
              updateFirestorePump(finishedUpdates);
            } catch (err) {
              console.warn("Firestore update failed:", err);
            }
          } else {
            setPump((prev) => ({
              ...prev,
              ...finishedUpdates
            }));
          }
        } else {
          const tickUpdates = {
            pulsingTimerSec: nextSec,
            totalLitresDispensed: parseFloat((pump.totalLitresDispensed + (pump.flowRateLpm / 60)).toFixed(1))
          };
          // Keep ticking down in local React/Firestore state
          if (!isLocalOnly) {
            try {
              updateFirestorePump(tickUpdates);
            } catch (err) {
              console.warn("Firestore update failed:", err);
            }
          } else {
            setPump((prev) => ({
              ...prev,
              ...tickUpdates
            }));
          }

          // Hydrate the relative sectors locally/globally
          setSectors((prevSectors) => 
            prevSectors.map((sec) => {
              if (sec.id === "sector-G14" && pump.currentMode === "intensive") {
                return {
                  ...sec,
                  nodes: sec.nodes.map((n) => ({
                    ...n,
                    soilMoisture: parseFloat(Math.min(65, n.soilMoisture + 0.3).toFixed(1))
                  }))
                };
              }
              return sec;
            })
          );
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pump.pulsingTimerSec, pump.flowRateLpm, pump.totalLitresDispensed, pump.currentMode, isLocalOnly, loggedInUser]);

  // Handler to manually execute irrigation advisory pulse sequence on the Firestore database
  const handleTriggerIrrigation = async (sectorId: string) => {
    const activePumpUpdates = {
      status: "active" as const,
      flowRateLpm: 15.8,
      pressureBar: 4.1,
      currentMode: "intensive" as const,
      pulsingTimerSec: 15
    };

    // Log the irrigation event locally
    offlineStorage.addIrrigationLog({
      sectorId,
      sectorName: sectorId === "sector-G14" ? "Greenhouse 14 (Mixed Crops)" : "Orchard Hub 7 (Dwarf Oranges)",
      durationSec: 15,
      litresDispensed: sectorId === "sector-G14" ? 12.5 : 18.0,
      mode: pump.currentMode === "eco" ? "Eco Hydrology" : pump.currentMode === "intensive" ? "Heavy Watering" : "Standard Mode"
    });

    if (!isLocalOnly) {
      try {
        // 1. Fire pump active mode inside live DB
        await updateFirestorePump(activePumpUpdates);

        // 2. Adjust core health index score of this sector and hydrate its nodes
        const sectorToHydrate = sectors.find((sec) => sec.id === sectorId);
        if (sectorToHydrate) {
          await updateFirestoreSector(sectorId, {
            plantHealthIndex: Math.min(100, sectorToHydrate.plantHealthIndex + 2)
          });

          // Boost node moisture levels across target field array and write to DB
          for (const node of sectorToHydrate.nodes) {
            await updateFirestoreNode(sectorId, node.id, {
              soilMoisture: parseFloat(Math.min(sectorToHydrate.moistureThresholdMax, node.soilMoisture + 3.5).toFixed(1))
            });
          }
        }
      } catch (err) {
        console.warn("Firestore update skipped or failed:", err);
      }
    } else {
      // Local Bypass Simulation updates directly in state
      setPump((prev) => ({
        ...prev,
        ...activePumpUpdates
      }));
      setSectors((prev) =>
         prev.map((sec) => {
           if (sec.id === sectorId) {
             return {
               ...sec,
               plantHealthIndex: Math.min(100, sec.plantHealthIndex + 2),
               nodes: sec.nodes.map((n) => ({
                 ...n,
                 soilMoisture: parseFloat(Math.min(sec.moistureThresholdMax, n.soilMoisture + 3.5).toFixed(1))
               }))
             };
           }
           return sec;
         })
      );
    }
  };

  // Handler to manually adjust individual node value via debug controls
  const handleModifyNodeMoisture = async (sectorId: string, nodeId: string, newMoisture: number) => {
    if (!isLocalOnly) {
      try {
        await updateFirestoreNode(sectorId, nodeId, {
          soilMoisture: parseFloat(newMoisture.toFixed(1))
        });
      } catch (err) {
        console.warn("Firestore update failed:", err);
      }
    } else {
      setSectors((prev) =>
        prev.map((sec) => {
          if (sec.id === sectorId) {
            return {
              ...sec,
              nodes: sec.nodes.map((n) => {
                if (n.id === nodeId) {
                  return { ...n, soilMoisture: parseFloat(newMoisture.toFixed(1)) };
                }
                return n;
              })
            };
          }
          return sec;
        })
      );
    }
  };

  // Handler to adjust pump operation mode preset inside persistent database
  const handleUpdatePumpMode = async (mode: "eco" | "intensive" | "biological" | "off") => {
    const pumpUpdates = {
      currentMode: mode,
      status: mode === "off" ? "shutdown" as const : "active" as const,
      flowRateLpm: mode === "eco" ? 5.2 : mode === "intensive" ? 18.5 : mode === "biological" ? 12.4 : 0,
      pressureBar: mode === "eco" ? 1.5 : mode === "intensive" ? 4.5 : mode === "biological" ? 3.2 : 0
    };

    if (!isLocalOnly) {
      try {
        await updateFirestorePump(pumpUpdates);
      } catch (err) {
        console.warn("Firestore update failed:", err);
      }
    } else {
      setPump((prev) => ({
        ...prev,
        ...pumpUpdates
      }));
    }
  };

  // Handler to top up reservoir level in Firestore
  const handleUpdateReservoirLevel = async (level: number) => {
    const prevPercent = pump.reservoirLevelPercent;

    // Log the reservoir level updates inside local storage
    offlineStorage.addWaterTankLog({
      prevLevelPercent: prevPercent,
      newLevelPercent: level,
      refillVolumeLitres: parseFloat(Math.max(0, (level - prevPercent) * 20.0).toFixed(1)), // assumption: 1% corresponds to 20 Litres
      actionType: level > prevPercent ? "refill" : "depletion"
    });

    if (!isLocalOnly) {
      try {
        await updateFirestorePump({
          reservoirLevelPercent: level
        });
      } catch (err) {
        console.warn("Firestore update failed:", err);
      }
    } else {
      setPump((prev) => ({
        ...prev,
        reservoirLevelPercent: level
      }));
    }
  };

  // Login handler
  const handleSuccessLogin = (userName: string) => {
    if (userName === "Admin Agronomist" || userName.startsWith("Admin")) {
      setIsBypassMode(true);
    } else {
      setIsBypassMode(false);
    }
    setLoggedInUser(userName);
    setCurrentPage(NavigationPage.DASHBOARD);
  };

  // Log Out out of Firebase Auth and Custom JWT
  const handleSignOut = async () => {
    try {
      await signOut(auth); // Still call it just in case Google Auth was used previously
    } catch (err) {
      console.warn("Firebase Auth sign out:", err);
    }
    
    // Clear custom auth tokens
    localStorage.removeItem("agrosensix_auth_token");
    localStorage.removeItem("agrosensix_cached_user");
    
    setIsBypassMode(false);
    setLoggedInUser(null);
    setCurrentPage(NavigationPage.HOME);
  };

  // Render the current active view content
  const renderActiveView = () => {
    if (!loggedInUser && currentPage !== NavigationPage.HOME && currentPage !== NavigationPage.ABOUT && currentPage !== NavigationPage.IMPACT && currentPage !== NavigationPage.SETTINGS) {
      return (
        <LoginView 
          onSuccessLogin={handleSuccessLogin} 
          onCancel={() => {
            setCurrentPage(NavigationPage.HOME);
            window.scrollTo(0, 0);
          }}
        />
      );
    }

    switch (currentPage) {
      case NavigationPage.HOME:
        return (
          <HomeView 
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo(0, 0);
            }} 
            plantHealthIndexG14={sectors[0]?.plantHealthIndex || 92}
            plantHealthIndex7G={sectors[1]?.plantHealthIndex || 84}
            userName={loggedInUser || "Prime Agronomist"}
            isLoggedIn={!!loggedInUser}
          />
        );
      case NavigationPage.DASHBOARD:
        return (
          <DashboardView 
            sectors={sectors}
            battery={battery}
            pump={pump}
            onTriggerIrrigation={handleTriggerIrrigation}
            onModifyNodeMoisture={handleModifyNodeMoisture}
          />
        );
      case NavigationPage.ANALYTICS:
        return <AnalyticsView />;
      case NavigationPage.AI_ASSISTANT:
        return <AiAssistantView sectors={sectors} battery={battery} pump={pump} isOnline={!forceOffline} />;
      case NavigationPage.GMAIL:
        return <GmailView sectors={sectors} battery={battery} pump={pump} />;
      case NavigationPage.IRRIGATION_CONTROL:
        return (
          <IrrigationView 
            pump={pump} 
            sectors={sectors}
            onTriggerIrrigation={handleTriggerIrrigation}
            onUpdatePumpMode={handleUpdatePumpMode}
            onUpdateReservoirLevel={handleUpdateReservoirLevel}
          />
        );
      case NavigationPage.IMPACT:
        return <ImpactView />;
      case NavigationPage.OFFLINE_HUB:
        return (
          <OfflineManager
            isOnline={isOnline}
            forceOffline={forceOffline}
            onSetForceOffline={setForceOffline}
            onTriggerIrrigation={handleTriggerIrrigation}
            onUpdateReservoirLevel={handleUpdateReservoirLevel}
          />
        );
      case NavigationPage.ARCHITECTURE:
        return <BlueprintView />;
      case NavigationPage.ABOUT:
        return <AboutView />;
      case NavigationPage.SETTINGS:
        return (
          <SettingsView 
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        );
      default:
        return (
          <HomeView 
            onNavigate={setCurrentPage} 
            plantHealthIndexG14={92} 
            plantHealthIndex7G={84} 
            userName="Admin" 
            isLoggedIn={!!loggedInUser} 
          />
        );
    }
  };

  // Navigation Links details list
  const navLinks = [
    { page: NavigationPage.HOME, label: "Home Dashboard", desc: "Farm Command Center", icon: Home },
    { page: NavigationPage.DASHBOARD, label: "Farm Intelligence", desc: "Digital twin crop telemetry", icon: Sprout },
    { page: NavigationPage.ANALYTICS, label: "Weather Intelligence", desc: "Barometric environments", icon: Sun },
    { page: NavigationPage.AI_ASSISTANT, label: "AI Assistant Workspace", desc: "Specialist crop advice suite", icon: Bot },
    { page: NavigationPage.GMAIL, label: "Gmail Alert Center", desc: "Automated warning gateway", icon: Mail },
    { page: NavigationPage.IRRIGATION_CONTROL, label: "Water Intelligence", desc: "Reservoir & eco pump status", icon: Droplets },
    { page: NavigationPage.IMPACT, label: "Our Impact Meter", desc: "Sustainability benchmark logs", icon: Leaf },
    { page: NavigationPage.OFFLINE_HUB, label: "Offline Grid System", desc: "Local database caching", icon: Database },
    { page: NavigationPage.ARCHITECTURE, label: "Diagnostics Center", desc: "ESP32 diagnostic boards", icon: Cpu },
    { page: NavigationPage.ABOUT, label: "About AgroSensiX", desc: "Startup vision & mission", icon: HelpCircle },
    { page: NavigationPage.SETTINGS, label: "System Center / Settings", desc: "Core preferences panel", icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex w-full bg-[var(--bg-app)] text-zinc-100 relative selection:bg-emerald-500/20 selection:text-emerald-300 ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      
      {/* 1. PERMANENT COLLAPSIBLE SIDEBAR (DESKTOP ONLY) */}
      <aside 
        className={`hidden lg:flex flex-col border-r border-zinc-900/60 bg-zinc-950/80 backdrop-blur-xl transition-all duration-350 select-none shrink-0 z-40 h-screen sticky top-0 ${
          isSidebarExpanded ? "w-72" : "w-20"
        }`}
      >
        {/* Sidebar Header with Brand logo */}
        <div className="p-4 border-b border-zinc-900/60 flex items-center justify-between overflow-hidden shrink-0">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage(NavigationPage.HOME)}>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/40 rounded-xl text-emerald-400 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] shrink-0">
              <Sprout className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
            {isSidebarExpanded && (
              <div className="animate-fade-in text-left">
                <span className="font-sans text-sm font-bold tracking-wider text-zinc-100 block leading-none">
                  AgroSensiX
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-semibold uppercase block tracking-widest mt-1">
                  Agricultural OS
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar text-left">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPage === link.page;
            return (
              <button
                key={link.page}
                onClick={() => {
                  setCurrentPage(link.page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-full group px-3 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3 border text-left cursor-pointer relative ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border-transparent"
                }`}
                title={!isSidebarExpanded ? link.label : undefined}
              >
                {/* Active page highlight indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
                )}

                <div className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isActive ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-350" : "bg-zinc-900/40 border-zinc-850 group-hover:border-zinc-800 text-zinc-500 group-hover:text-zinc-300"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isSidebarExpanded ? (
                  <div className="truncate animate-fade-in">
                    <p className="text-xs font-sans font-bold leading-none tracking-wide">{link.label}</p>
                    <p className="text-[9px] font-sans text-zinc-500 font-medium tracking-normal mt-1 leading-none">{link.desc}</p>
                  </div>
                ) : (
                  <div className="absolute left-16 bg-zinc-950 border border-zinc-850 text-emerald-400 text-[10px] font-sans font-semibold px-3 py-1.5 rounded-lg shadow-xl uppercase tracking-wider opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1.5 transition-all z-50 whitespace-nowrap">
                    {link.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with session/bypass badges + expand-collapse toggle button */}
        <div className="p-3 border-t border-zinc-900/60 space-y-2.5 bg-zinc-950/40 shrink-0">
          {/* Admin badge */}
          {isSidebarExpanded && loggedInUser && (
            <div className="p-2 bg-zinc-900/50 border border-zinc-900/60 rounded-xl flex items-center gap-2 font-mono text-[9px] tracking-wide text-zinc-400 uppercase truncate">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">SYS_ADMIN: {loggedInUser}</span>
            </div>
          )}

          {/* Sidebar collapse toggle */}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="w-full py-2 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-850 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-[10px] font-mono uppercase tracking-widest"
            title={isSidebarExpanded ? "Collapse Sidebar Menu" : "Expand Sidebar Menu"}
          >
            {isSidebarExpanded ? (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>COLLAPSE OS</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
            )}
          </button>
        </div>
      </aside>

      {/* 2. MOBILE FLOATING GLASS SLIDE-OUT DRAWER (MOBILE VIEW ONLY) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop glass overlay */}
          <div 
            className="fixed inset-0 bg-zinc-950/70 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <aside className="relative flex flex-col w-72 max-w-xs bg-zinc-950 border-r border-zinc-900 h-full p-4 space-y-4 animate-fade-in z-50 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                  <Sprout className="w-4 h-4" />
                </div>
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-zinc-100">AgroSensiX Mobile</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentPage === link.page;
                return (
                  <button
                    key={link.page}
                    onClick={() => {
                      setCurrentPage(link.page);
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl transition-colors flex items-center gap-3 border text-left cursor-pointer ${
                      isActive
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60 font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-sans font-bold leading-none">{link.label}</p>
                      <p className="text-[9px] font-sans text-zinc-500 mt-1 leading-none">{link.desc}</p>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-zinc-900 space-y-2">
              {loggedInUser && (
                <div className="p-2 bg-zinc-900/40 rounded-lg flex items-center gap-2 font-mono text-[9px] text-zinc-400 uppercase truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate">{loggedInUser}</span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full py-2 bg-red-950/10 hover:bg-red-950/20 border border-red-900/20 text-red-400 rounded-xl text-xs font-sans font-bold uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out Session
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. MAIN WORKSPACE / CONTENT VIEWPORT SPLIT PANEL */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        
        {/* Dynamic ambient radial lighting and premium grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Platform Floating Header / Glassmorphic Action Navbar */}
        <header className="sticky top-0 z-30 bg-[var(--bg-navbar)] backdrop-blur-xl border-b border-zinc-900/60 p-4 shadow-sm shrink-0">
          <div className="w-full flex items-center justify-between">
            
            {/* Header Title Information Context */}
            <div className="flex items-center gap-3">
              {/* Mobile Burger Open Trigger (Only shown on LG hidden and down) */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-zinc-400 hover:text-zinc-200 focus:outline-none border border-zinc-900 rounded-xl bg-zinc-950/40 cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="text-left">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">
                  {currentPage === NavigationPage.HOME ? "SYS_STATUS: READY" : `MODULE: ${currentPage?.toUpperCase()}`}
                </span>
                <h1 className="font-sans text-sm md:text-base font-bold tracking-tight text-zinc-100 flex items-center gap-2 mt-0.5 select-none leading-none">
                  {navLinks.find((l) => l.page === currentPage)?.label || "Agricultural Operating System"}
                  <span className="text-zinc-550 font-normal">|</span>
                  <span className="text-[10px] font-sans font-medium text-zinc-450 hidden sm:inline">
                    {navLinks.find((l) => l.page === currentPage)?.desc || "AgriTech precision hub"}
                  </span>
                </h1>
              </div>
            </div>

            {/* Header Actions Panel (No light togglers, strictly system session status & networks) */}
            <div className="flex items-center gap-3">
              {loggedInUser && (
                <button
                  onClick={() => handleUpdatePumpMode("off")}
                  className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-rose-450 font-mono text-[9.5px] uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm rounded-xl font-bold active:scale-95 group"
                  title="EMERGENCY: Immediately halt all active water pumping and override pulser timers."
                >
                  <AlertOctagon className="w-3.5 h-3.5 shrink-0 group-hover:animate-pulse" />
                  <span className="hidden sm:inline">STOP ALL PUMPING</span>
                </button>
              )}

              {/* Force Offline Simulation status badge */}
              <button
                onClick={() => setForceOffline(!forceOffline)}
                className={`px-3 py-2.5 rounded-xl border font-mono text-[9.5px] uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  forceOffline
                    ? "bg-amber-950/30 border-amber-500/40 text-amber-400 hover:bg-amber-950/50 hover:border-amber-500/60 font-semibold"
                    : "bg-zinc-950/80 hover:bg-zinc-900 border-zinc-900/60 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400"
                }`}
                title={forceOffline ? "Re-connect to real Firebase Cloud database" : "Disconnect and simulate full offline operations"}
              >
                {forceOffline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-500 animate-pulse" />
                    <span className="hidden sm:inline">SIM_OFFLINE</span>
                  </>
                ) : !isOnline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>DEVICE_OFFLINE</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span className="hidden sm:inline">ONLINE_CONNECTED</span>
                  </>
                )}
              </button>

              {/* Administrator Session Status Profile / Shortcut */}
              {loggedInUser ? (
                <>
                  <div className="hidden md:flex px-3 py-2.5 bg-zinc-950/80 border border-zinc-900/60 rounded-xl items-center gap-2 font-mono text-[9px] tracking-wider text-zinc-400 uppercase select-none max-w-xs truncate shadow-inner">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    SYS_ADMIN: {loggedInUser.length > 20 ? `${loggedInUser.substring(0, 17)}...` : loggedInUser}
                  </div>
                  
                  {/* Settings Page Button */}
                  <button
                    onClick={() => {
                      setCurrentPage(NavigationPage.SETTINGS);
                      window.scrollTo(0, 0);
                    }}
                    className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center ${
                      currentPage === NavigationPage.SETTINGS
                        ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400"
                        : "bg-zinc-950/80 hover:bg-zinc-900 border-zinc-900/60 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400"
                    }`}
                    title="Open OS System Settings"
                  >
                    <Settings className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 shrink-0" />
                  </button>

                  {/* Sign out */}
                  <button
                    onClick={handleSignOut}
                    className="p-2.5 hover:bg-red-950/20 rounded-xl text-zinc-500 hover:text-red-400 border border-zinc-900/40 hover:border-red-900/50 transition-all duration-300 cursor-pointer shadow-sm"
                    title="Log out platform session"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setCurrentPage(NavigationPage.SETTINGS);
                    window.scrollTo(0, 0);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-zinc-950 font-sans font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-cyan-950/20 hover:-translate-y-0.5 cursor-pointer select-none active:scale-95 text-center px-4 animate-fade-in"
                >
                  START OS
                </button>
              )}
            </div>

          </div>
        </header>

        {/* Main Core Section Content Viewport bounds */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 pb-20 relative">
          
          {/* Dynamic Water Pump manual pulse warning overlay banner */}
          {pump.pulsingTimerSec > 0 && (
            <div className="mb-6 bg-[#081e24] border border-cyan-800/40 text-cyan-300 p-3.5 pr-12 rounded-2xl text-xs font-mono flex items-center justify-between animate-pulse relative shadow-lg">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 animate-spin text-cyan-400" />
                <span>WATER OVERRIDE ONGOING (CYCLES IN HOUSE 14): {pump.pulsingTimerSec}s SECONDS RUN TIME REMAINING.</span>
              </div>
              <button
                onClick={() => {
                  updateFirestorePump({
                    status: "standby",
                    flowRateLpm: 0,
                    pressureBar: 0,
                    currentMode: "biological",
                    pulsingTimerSec: 0
                  });
                }}
                className="absolute right-3.5 top-2.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 px-2 py-1 text-[9px] uppercase rounded-lg text-cyan-200 block transition-colors cursor-pointer"
              >
                STOP FLOW
              </button>
            </div>
          )}

          {renderActiveView()}
        </main>

        {/* Smart Farming Footer Status Rail */}
        <footer className="border-t border-zinc-900/80 bg-[var(--bg-footer)] backdrop-blur-md py-3 px-4 text-center text-[10px] font-mono text-zinc-550 select-none sticky bottom-0 z-30 shrink-0">
          <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 uppercase tracking-wider text-zinc-650">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Greenhouse G14 [nominal]
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Orchard Hub 7G [nominal]
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Solar power harvest: nominal (4.8 kW)
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[9.5px] text-zinc-500 uppercase font-semibold">
              <Calendar className="w-3.5 h-3.5 text-zinc-600" />
              <span>{currentIstTime}</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
