const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We will change the pattern:
// if (!isLocalOnly) { try { update... } catch {} } else { setX(...) }
// to:
// setX(...); if (!isLocalOnly) { try { update... } catch {} }

// 1. In pulsingTimerSec (tick)
code = code.replace(
  `          if (!isLocalOnly) {\n            try {\n              updateFirestorePump(tickUpdates);\n            } catch (err) {\n              console.warn("Firestore update failed:", err);\n            }\n          } else {\n            setPump((prev) => ({\n              ...prev,\n              ...tickUpdates\n            }));\n          }`,
  `          setPump((prev) => ({\n            ...prev,\n            ...tickUpdates\n          }));\n          if (!isLocalOnly) {\n            try {\n              updateFirestorePump(tickUpdates);\n            } catch (err) {\n              console.warn("Firestore update failed:", err);\n            }\n          }`
);

// 2. In pulsingTimerSec (finished)
code = code.replace(
  `          if (!isLocalOnly) {\n            try {\n              // Finished pulse sequence, return pump to baseline idle standby state globally on DB\n              updateFirestorePump(finishedUpdates);\n            } catch (err) {\n              console.warn("Firestore update failed:", err);\n            }\n          } else {\n            setPump((prev) => ({\n              ...prev,\n              ...finishedUpdates\n            }));\n          }`,
  `          setPump((prev) => ({\n            ...prev,\n            ...finishedUpdates\n          }));\n          if (!isLocalOnly) {\n            try {\n              // Finished pulse sequence, return pump to baseline idle standby state globally on DB\n              updateFirestorePump(finishedUpdates);\n            } catch (err) {\n              console.warn("Firestore update failed:", err);\n            }\n          }`
);

// 3. In handleUpdatePumpMode
code = code.replace(
  `    if (!isLocalOnly) {\n      try {\n        await updateFirestorePump(pumpUpdates);\n      } catch (err) {\n        console.warn("Firestore update failed:", err);\n      }\n    } else {\n      setPump((prev) => ({\n        ...prev,\n        ...pumpUpdates\n      }));\n    }`,
  `    setPump((prev) => ({\n      ...prev,\n      ...pumpUpdates\n    }));\n    if (!isLocalOnly) {\n      try {\n        await updateFirestorePump(pumpUpdates);\n      } catch (err) {\n        console.warn("Firestore update failed:", err);\n      }\n    }`
);

// 4. In handleUpdateReservoirLevel
code = code.replace(
  `    if (!isLocalOnly) {\n      try {\n        await updateFirestorePump({\n          reservoirLevelPercent: level\n        });\n      } catch (err) {\n        console.warn("Firestore update failed:", err);\n      }\n    } else {\n      setPump((prev) => ({\n        ...prev,\n        reservoirLevelPercent: level\n      }));\n    }`,
  `    setPump((prev) => ({\n      ...prev,\n      reservoirLevelPercent: level\n    }));\n    if (!isLocalOnly) {\n      try {\n        await updateFirestorePump({ reservoirLevelPercent: level });\n      } catch (err) {\n        console.warn("Firestore update failed:", err);\n      }\n    }`
);

fs.writeFileSync('src/App.tsx', code);
