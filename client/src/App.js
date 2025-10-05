import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import SolarSystemView from "./components/SolarSystemView";
import ImpactSimulation from "./components/ImpactSimulation";
import MitigationPlanner from "./components/MitigationPlanner";
import Sidebar from "./components/Sidebar";
import RiskAnalysis from "./components/RiskAnalysis";

function App() {
  const [activeModule, setActiveModule] = useState("orbital");
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false);

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
      {/* Galaxy Background */}
      <Canvas className="absolute top-0 left-0 w-full h-full -z-10">
        <Stars
          radius={300}
          depth={60}
          count={20000}
          factor={7}
          saturation={0}
          fade
        />
        <OrbitControls enableZoom={false} />
      </Canvas>

      {/* Header */}
      <header className="backdrop-blur-md bg-black/30 shadow-lg border-b border-white/20 p-6 text-center">
        <motion.h1
          className="text-3xl font-bold tracking-wide text-cyan-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🌌 A.I.M. – Asteroid Impact Mitigation Visualizer
        </motion.h1>
        <p className="text-gray-300 text-sm mt-2">
          Interactive tool for asteroid threat assessment and mitigation planning
        </p>
      </header>

      <div className="flex">
        {/* Sidebar */}

        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          selectedAsteroid={selectedAsteroid}
          setSelectedAsteroid={setSelectedAsteroid}
        />

        {/* Visualization Area */}
        <main className="flex-1 p-6 relative z-10">
          <AnimatePresence mode="wait">
            {activeModule === "orbital" && (
              <motion.div
                key="orbital"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.5 }}
              >
                <SolarSystemView
                  onAsteroidSelect={setSelectedAsteroid}
                  selectedAsteroid={selectedAsteroid}
                />
              </motion.div>
            )}
            {activeModule === "impact" && (
              <motion.div
                key="impact"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.5 }}
              >
                <ImpactSimulation asteroid={selectedAsteroid} />
              </motion.div>
            )}
            {activeModule === "mitigation" && (
              <motion.div
                key="mitigation"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.5 }}
              >
                <MitigationPlanner asteroid={selectedAsteroid} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      
      {showRiskAnalysis && selectedAsteroid && (
        <RiskAnalysis 
          asteroid={selectedAsteroid}
          onClose={() => setShowRiskAnalysis(false)}
        />
      )}
    </div>
  );
}

export default App;