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
import { offlineStorage } from "./utils/offlineStorage";

// Import Layout Icons
import { 
  Sprout, 
  LayoutDashboard, 
  LineChart, 
  Bot, 
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
  Database
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
  const [currentUtcTime, setCurrentUtcTime] = useState("");

  // Live clock updates in UTC format
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcString = now.toUTCString().replace("GMT", "UTC");
      setCurrentUtcTime(utcString);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to live Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Authenticated Session detected!
        setIsBypassMode(false);
        const parsedName = firebaseUser.displayName || firebaseUser.email || "Certified Agronomist";
        setLoggedInUser(parsedName);
        
        // Dynamic DB self-healing check: seed the database config collections if starting empty (only if online)
        if (!forceOffline && navigator.onLine) {
          await seedDatabaseIfEmpty();
        }
        
        // After log in, redirect to telemetries grid as primary dashboard
        setCurrentPage(NavigationPage.DASHBOARD);
      } else {
        // No session found, redirect to login page unless we are in the custom secure local bypass session or offline mode
        if (!isLocalOnly) {
          setLoggedInUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, [isBypassMode, loggedInUser, forceOffline, isOnline]);

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

  // Log Out out of Firebase Auth
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsBypassMode(false);
      setLoggedInUser(null);
      setCurrentPage(NavigationPage.HOME);
    } catch (err) {
      console.error("Agronomist session log out failed:", err);
    }
  };

  // Render the current active view content
  const renderActiveView = () => {
    if (!loggedInUser && currentPage !== NavigationPage.HOME && currentPage !== NavigationPage.ABOUT && currentPage !== NavigationPage.IMPACT) {
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
        return <AiAssistantView sectors={sectors} battery={battery} pump={pump} />;
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
    { page: NavigationPage.HOME, label: "Home Overview", icon: Sprout },
    { page: NavigationPage.DASHBOARD, label: "Farm Monitoring", icon: LayoutDashboard },
    { page: NavigationPage.ANALYTICS, label: "Weather & Environment", icon: LineChart },
    { page: NavigationPage.AI_ASSISTANT, label: "AI Assistant", icon: Bot },
    { page: NavigationPage.IRRIGATION_CONTROL, label: "Water Control", icon: Sliders },
    { page: NavigationPage.IMPACT, label: "Our Impact", icon: Leaf },
    { page: NavigationPage.OFFLINE_HUB, label: "Offline Operations", icon: Database },
    { page: NavigationPage.ARCHITECTURE, label: "System Information", icon: Code },
    { page: NavigationPage.ABOUT, label: "About Us", icon: HelpCircle },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <div className="flex-1 flex flex-col bg-[var(--bg-app)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--bg-app-gradient-from)] via-[var(--bg-app)] to-[var(--bg-app-gradient-to)] text-zinc-100 relative overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-300">
        
        {/* Dynamic ambient radial lighting and premium grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Platform Header / Floating glassmorphic Navbar */}
        <header className="sticky top-0 z-40 bg-[var(--bg-navbar)] backdrop-blur-xl border-b border-zinc-900/60 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Name & Sprout */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage(NavigationPage.HOME)}>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/40 rounded-xl text-emerald-400 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Sprout className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <span className="font-sans text-sm font-bold tracking-wider text-zinc-100 block leading-none">
                AgroSensiX
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase block tracking-widest mt-1">
                Smart Farming Platform
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
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
                  className={`px-3.5 py-2 text-xs font-mono rounded-lg transition-all duration-300 uppercase flex items-center gap-1.5 cursor-pointer border ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.05)]"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30 border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {link.label.split(" ")[0]} 
                </button>
              );
            })}
          </nav>

          {/* Right Action Widgets (Authenticated Profile Badges + Log Out + Theme Mode Toggles) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Network Offline Simulation Toggle */}
            <button
              onClick={() => setForceOffline(!forceOffline)}
              className={`px-3.5 py-2.5 rounded-xl border font-mono text-[9.5px] uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm ${
                forceOffline
                  ? "bg-amber-950/30 border-amber-500/40 text-amber-400 hover:bg-amber-950/50 hover:border-amber-500/60 font-semibold"
                  : "bg-zinc-950/80 hover:bg-zinc-900 border-zinc-900/60 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400"
              }`}
              title={forceOffline ? "Re-connect to real Firebase Cloud database" : "Disconnect and simulate full offline operations"}
            >
              {forceOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-500 animate-pulse" />
                  <span>SIM_OFFLINE</span>
                </>
              ) : !isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span>OFFLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>ONLINE</span>
                </>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-desktop"
              onClick={toggleTheme}
              className="p-2.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900/60 hover:border-emerald-500/30 rounded-xl text-zinc-450 hover:text-emerald-400 transition-all duration-300 cursor-pointer shadow-sm flex items-center justify-center gap-2 hover:shadow-[0_0_12px_rgba(16,185,129,0.08)]"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'light' ? (
                <>
                  <span className="text-sm select-none" role="img" aria-label="Sun">☀️</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider hidden xl:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <span className="text-sm select-none" role="img" aria-label="Moon">🌙</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider hidden xl:inline">Dark Mode</span>
                </>
              )}
            </button>

            {loggedInUser ? (
              <>
                <div className="px-3.5 py-2 bg-zinc-950/80 border border-zinc-900/60 rounded-xl flex items-center gap-2 font-mono text-[9.5px] tracking-wider text-zinc-400 uppercase select-none max-w-xs truncate shadow-inner">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                  ADMINISTRATOR: {loggedInUser.length > 25 ? `${loggedInUser.substring(0, 22)}...` : loggedInUser}
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-red-950/20 rounded-xl text-zinc-500 hover:text-red-400 border border-zinc-900/40 hover:border-red-900/50 transition-all duration-300 cursor-pointer shadow-sm animate-fade-in"
                  title="Log out platform session"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setCurrentPage(NavigationPage.DASHBOARD);
                  window.scrollTo(0, 0);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-cyan-950/20 hover:-translate-y-0.5 cursor-pointer select-none active:scale-95 text-center px-6 animate-fade-in"
              >
                Launch OS
              </button>
            )}
          </div>

          {/* Responsive Mobile Menu Trigger Switches with Theme Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Theme Toggle Button for Mobile */}
            <button
              id="theme-toggle-mobile"
              onClick={toggleTheme}
              className="p-2 text-zinc-400 hover:text-emerald-500 border border-zinc-950 rounded-lg bg-zinc-950/40"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'light' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 text-zinc-400 hover:text-red-400 focus:outline-none"
              title="Sign Out Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-zinc-200 focus:outline-none border border-zinc-900 rounded-lg bg-zinc-950/40"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-zinc-900 max-w-7xl mx-auto space-y-1 font-mono uppercase text-xs">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPage === link.page;
              return (
                <button
                  key={link.page}
                  onClick={() => {
                    setCurrentPage(link.page);
                    setMobileMenuOpen(false);
                    window.scrollTo(0, 0);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 ${
                    isActive
                      ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 font-semibold"
                      : "text-zinc-550 hover:text-zinc-200 hover:bg-zinc-900/30"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {link.label}
                </button>
              );
            })}
            
            {/* Mobile Network Offline Simulation Toggle */}
            <div className="pt-2.5 mt-2.5 border-t border-zinc-900/60">
              <button
                onClick={() => setForceOffline(!forceOffline)}
                className={`w-full px-3 py-3 rounded-lg flex items-center justify-between text-left font-mono ${
                  forceOffline
                    ? "bg-amber-950/20 text-amber-400 border border-amber-900/40"
                    : "bg-zinc-950/40 text-zinc-400 border border-zinc-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  {forceOffline || !isOnline ? <WifiOff className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" /> : <Wifi className="w-4 h-4 shrink-0 text-emerald-400" />}
                  NETWORK STATUS
                </span>
                <span className="text-[10px] bg-zinc-900/80 px-2 py-0.5 rounded-md font-bold">
                  {forceOffline ? "SIM_OFFLINE" : !isOnline ? "DEVICE OFFLINE" : "ONLINE CONNECTED"}
                </span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Core Section Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20 relative">
        {/* Dynamic Water Pump manual pulse banner overlay if currently pulsing */}
        {pump.pulsingTimerSec > 0 && (
          <div className="mb-6 bg-[#081e24] border border-cyan-800/40 text-cyan-300 p-3.5 pr-12 rounded-xl text-xs font-mono flex items-center justify-between animate-pulse relative">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 animate-spin text-cyan-400" />
              <span>WATER OVERRIDE ACTIVE (GREENHOUSE 14): {pump.pulsingTimerSec}s SECONDS REMAINING.</span>
            </div>
            <button
              onClick={() => {
                // Cancel ongoing pump pulse on Firestore
                updateFirestorePump({
                  status: "standby",
                  flowRateLpm: 0,
                  pressureBar: 0,
                  currentMode: "biological",
                  pulsingTimerSec: 0
                });
              }}
              className="absolute right-3.5 top-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 p-1 text-[9.5px] uppercase rounded text-cyan-200 block transition-colors cursor-pointer"
            >
              STOP WATER
            </button>
          </div>
        )}

        {renderActiveView()}
      </main>

      {/* Smart Farming Footer Status Rail */}
      <footer className="border-t border-zinc-900 bg-[var(--bg-footer)] backdrop-blur-md py-3 px-4 text-center text-[10px] font-mono text-zinc-550 select-none sticky bottom-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 uppercase tracking-wider text-zinc-650">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Greenhouse 14 Connection [nominal]
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Orchard Hub 7 Connection [nominal]
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Solar power level: ok
            </span>
          </div>

          <div className="flex items-center justify-center gap-1 text-[9.5px] text-zinc-500 uppercase">
            <Calendar className="w-3.5 h-3.5 text-zinc-650" />
            <span className="font-semibold">{currentUtcTime}</span>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
}
