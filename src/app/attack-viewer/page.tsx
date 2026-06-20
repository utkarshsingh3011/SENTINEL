"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { saveCampaignToHistory } from "../../components/campaignStore";
import { 
  Play, Pause, RotateCcw, ArrowLeft, Terminal, 
  Activity, ShieldCheck, Brain
} from "lucide-react";

interface CampaignStage {
  title: string;
  description: string;
  log: string;
  status: "evaded" | "blocked" | "alerted";
  severity: "low" | "medium" | "high" | "critical";
}

interface CampaignConfig {
  industry: string;
  threatActor: string;
  attackType: string;
  securityLevel: string;
  timestamp: string;
  riskFactor: number;
  compromiseChance: number;
  primaryTarget: string;
  stages: CampaignStage[];
}

const FALLBACK_CAMPAIGN: CampaignConfig = {
  industry: "Banking",
  threatActor: "Lazarus Group",
  attackType: "Supply Chain",
  securityLevel: "High",
  timestamp: new Date().toISOString(),
  riskFactor: 54,
  compromiseChance: 42,
  primaryTarget: "Swift-Transfer-Core",
  stages: [
    {
      title: "Reconnaissance & Port Scan",
      description: "Attacker Lazarus Group initiated active reconnaissance scans mapping the target subnets for Banking.",
      log: "[RECON] Mapping subnets on segment 10.0.4.x. Found open ports: 443, 8080. EDR status: BLOCKED",
      status: "blocked",
      severity: "low",
    },
    {
      title: "Initial Access Foothold",
      description: "Foothold vector established using Supply Chain (T1195.002) to bypass gateway filtering.",
      log: "[INGRESS] Exploit payload dispatched. Channel established with target client. EDR status: BLOCKED",
      status: "blocked",
      severity: "medium",
    },
    {
      title: "Credential Swipe",
      description: "Searching local memory dumps and active directory tables for active session tokens and admin keys.",
      log: "[CREDENTIALS] LSASS memory dump initiated / credential extraction requested. EDR status: EVADED",
      status: "evaded",
      severity: "medium",
    },
    {
      title: "Lateral Subnet Propagation",
      description: "Pivoting from compromised host endpoints to jump servers. Internal target segment reached: Swift-Transfer-Core.",
      log: "[LATERAL] Remote session hijacked to cross network subnets. Target node reached: Swift-Transfer-Core. EDR status: BLOCKED",
      status: "blocked",
      severity: "high",
    },
    {
      title: "Privilege Domain Escalation",
      description: "Attempting admin privilege elevation via token impersonation on Active Directory controller nodes.",
      log: "[ESCALATION] Token impersonation executed. Root credentials retrieved. EDR status: EVADED",
      status: "evaded",
      severity: "high",
    },
    {
      title: "Data Exfiltration & Impact",
      description: "Executing final payload actions on database target Swift-Transfer-Core. Archiving core customer tables.",
      log: "[EXFILTRATION] Compressing database files. Transmitting out of band over port 443. EDR status: EVADED",
      status: "evaded",
      severity: "critical",
    },
  ],
};

export default function AttackViewerPage() {
  const [campaign, setCampaign] = useState<CampaignConfig | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // 1. Helper to dynamically stream sub-logs matching the CampaignConfig details
  // Defined with useCallback and placed above useEffect to prevent hoisting errors
  const addDynamicSubLog = useCallback((stageIdx: number, subIndex: number) => {
    if (!campaign) return;
    const stage = campaign.stages[stageIdx];
    let newLog = "";

    switch (stageIdx) {
      case 0: // Recon
        if (subIndex === 0) newLog = `[RECON] Mapping subnets on segment ${campaign.industry} networks...`;
        if (subIndex === 1) newLog = `[RECON] Running port scans on boundary firewalls...`;
        if (subIndex === 2) newLog = `[RECON] Found open server bindings. Status: ${stage.status.toUpperCase()}`;
        break;
      case 1: // Initial Access
        if (subIndex === 0) newLog = `[INGRESS] Constructing exploit payload wrapper for vector: ${campaign.attackType}...`;
        if (subIndex === 1) newLog = `[INGRESS] Payload execution requested on host client...`;
        if (subIndex === 2) newLog = `[INGRESS] Access channel establishing. Gateway: ${stage.status.toUpperCase()}`;
        break;
      case 2: // Credential Theft
        if (subIndex === 0) newLog = `[CREDENTIALS] Querying memory maps for authentication hashes...`;
        if (subIndex === 1) newLog = `[CREDENTIALS] Accessing Active Directory domain databases...`;
        if (subIndex === 2) newLog = `[CREDENTIALS] Local session key acquisition: ${stage.status.toUpperCase()}`;
        break;
      case 3: // Lateral Movement
        if (subIndex === 0) newLog = `[LATERAL] Moving from host endpoints to administrative jump routes...`;
        if (subIndex === 1) newLog = `[LATERAL] Accessing target segment for core node ${campaign.primaryTarget}...`;
        if (subIndex === 2) newLog = `[LATERAL] Remote segment shell access: ${stage.status.toUpperCase()}`;
        break;
      case 4: // Privilege Escalation
        if (subIndex === 0) newLog = `[ESCALATION] Attempting token hijack privileges on database segments...`;
        if (subIndex === 1) newLog = `[ESCALATION] Bypassing localized system protection rules...`;
        if (subIndex === 2) newLog = `[ESCALATION] Root administrative authorization: ${stage.status.toUpperCase()}`;
        break;
      case 5: // Exfiltration
        if (subIndex === 0) newLog = `[EXFILTRATION] Compressing database schema tables...`;
        if (subIndex === 1) newLog = `[EXFILTRATION] Transmitting packets to C2 external node...`;
        if (subIndex === 2) newLog = `[EXFILTRATION] Data transfer sequence completed. State: ${stage.status.toUpperCase()}`;
        break;
      default:
        break;
    }

    if (newLog) {
      setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] ${newLog}`]);
    }
  }, [campaign]);

  // 2. Read configuration from sessionStorage on mount
  // Deferred asynchronously via setTimeout to avoid synchronous setState inside render loop
  useEffect(() => {
    const loadCampaign = () => {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("aegis_campaign_config");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCampaign(parsed);
            saveCampaignToHistory(parsed);
            return;
          } catch {
            // fallback
          }
        }
      }
      setCampaign(FALLBACK_CAMPAIGN);
      saveCampaignToHistory(FALLBACK_CAMPAIGN);
    };

    const timer = setTimeout(loadCampaign, 50);
    return () => clearTimeout(timer);
  }, []);

  // 3. Playback and log streaming engine
  useEffect(() => {
    if (!campaign || !isPlaying) return;

    // Simulation playback variables: each stage takes 4 seconds (4000ms)
    const stageDuration = 4000;
    const updateInterval = 100; // update UI state every 100ms
    let elapsedTimeInStage = 0;

    const streamTimer = setInterval(() => {
      elapsedTimeInStage += updateInterval;
      
      // Calculate overall progress across the 6 stages
      const totalStages = campaign.stages.length;
      const baseProgress = (currentStageIdx / totalStages) * 100;
      const stageWeight = 100 / totalStages;
      const stageFraction = elapsedTimeInStage / stageDuration;
      const currentProgress = baseProgress + (stageFraction * stageWeight);
      setProgress(Math.min(100, Math.floor(currentProgress)));

      // Add a couple of sub-logs periodically within the stage
      if (elapsedTimeInStage === 400) {
        addDynamicSubLog(currentStageIdx, 0);
      } else if (elapsedTimeInStage === 1800) {
        addDynamicSubLog(currentStageIdx, 1);
      } else if (elapsedTimeInStage === 3200) {
        addDynamicSubLog(currentStageIdx, 2);
      }

      // Stage completion transition
      if (elapsedTimeInStage >= stageDuration) {
        const stage = campaign.stages[currentStageIdx];
        setTerminalLogs(prev => [
          ...prev, 
          `[STAGE DONE] Completed Phase: ${stage.title} | Result: ${stage.status.toUpperCase()}`
        ]);
        
        if (currentStageIdx < totalStages - 1) {
          setCurrentStageIdx(prev => prev + 1);
          elapsedTimeInStage = 0;
        } else {
          // Finished entire simulation
          setIsPlaying(false);
          setProgress(100);
          clearInterval(streamTimer);
          setTerminalLogs(prev => [...prev, `[COMPLETE] --- All attack stages executed ---`]);
        }
      }
    }, updateInterval);

    return () => clearInterval(streamTimer);
  }, [campaign, isPlaying, currentStageIdx, addDynamicSubLog]);

  // Scroll terminal logs to bottom automatically
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentStageIdx(0);
    setProgress(0);
    setTerminalLogs([]);
    setTimeout(() => setIsPlaying(true), 100);
  };

  // Generate dynamic defenses mapping based on campaign config
  const getRecommendedDefenses = (attackType: string) => {
    switch (attackType) {
      case "Phishing":
        return [
          { title: "Enforce Hardware MFA", desc: "Deploy FIDO2 security keys globally to intercept compromised credential use." },
          { title: "DMARC/SPF Ingress Rules", desc: "Enable reject policies on external mail filters to block sender domain spoofs." },
          { title: "EDR Sandbox Policies", desc: "Configure endpoint detection to execute email payload files in temporary containers." }
        ];
      case "Ransomware":
        return [
          { title: "Immutable GCS Backups", desc: "Enable non-rewritable cloud database snapshots to bypass wiper threats." },
          { title: "Volume Write Locks", desc: "Deploy host controls to block script writes to sensitive folder volumes." },
          { title: "Microsegmentation Blocks", desc: "Restrict lateral ports between developer hosts and operational subnets." }
        ];
      case "DDoS":
        return [
          { title: "BGP Scrubber Routing", desc: "Route ingress packets through volumetric scrubbers to clean exhaust surges." },
          { title: "SYN-Cookies & Rate Limits", desc: "Implement firewall connection rate limits on border load balancers." },
          { title: "DNS Query Throttling", desc: "Restrict external lookup frequencies to bypass recursive resolver poison loops." }
        ];
      case "Supply Chain":
        return [
          { title: "Checksum Sign Controls", desc: "Enforce sha-256 package checks before importing public script dependencies." },
          { title: "Isolated CI/CD Runners", desc: "Run build pipelines inside ephemeral, internet-restricted docker instances." },
          { title: "Repository Mirrors", desc: "Sync open source dependencies through verified internal registry proxies." }
        ];
      case "SQL Injection":
        return [
          { title: "Prepared Bind Queries", desc: "Mandate parameterized sql commands across all application server models." },
          { title: "WAF SQL Regex Rules", desc: "Configure Web Application Firewalls to intercept UNION/SELECT script entries." },
          { title: "Least Privilege DB Access", desc: "Disable application database user write privileges on schema tables." }
        ];
      default:
        return [
          { title: "Zero Trust Architecture", desc: "Enforce microsegments, MFA, and continuous session token verification." },
          { title: "Active SOC Monitoring", desc: "Ingest WMI, Active Directory, and netflow records into SIEM rules." }
        ];
    }
  };

  // Generate dynamic MITRE techniques based on campaign config
  const getMitreTechniques = (attackType: string) => {
    const common = [
      { id: "T1078", name: "Valid Accounts", category: "Defense Evasion" },
      { id: "T1021", name: "Remote Services", category: "Lateral Move" },
      { id: "T1003", name: "OS Credential Dumping", category: "Credential Theft" }
    ];

    switch (attackType) {
      case "Phishing":
        return [
          { id: "T1566.002", name: "Spearphishing Link", category: "Initial Access" },
          { id: "T1204.001", name: "User Execution", category: "Execution" },
          ...common
        ];
      case "Ransomware":
        return [
          { id: "T1486", name: "Data Encrypted for Impact", category: "Impact" },
          { id: "T1490", name: "Inhibit System Recovery", category: "Impact" },
          ...common
        ];
      case "DDoS":
        return [
          { id: "T1498.001", name: "Direct Network Flood", category: "Impact" },
          { id: "T1499", name: "Endpoint Denial of Service", category: "Impact" },
          ...common
        ];
      case "Supply Chain":
        return [
          { id: "T1195.002", name: "Compromise Software Dependencies", category: "Initial Access" },
          { id: "T1072", name: "Software Deployment", category: "Execution" },
          ...common
        ];
      case "SQL Injection":
        return [
          { id: "T1190", name: "Exploit Public-Facing Application", category: "Initial Access" },
          { id: "T1505.003", name: "Web Shell", category: "Persistence" },
          ...common
        ];
      default:
        return common;
    }
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center font-mono text-xs text-slate-500">
        <Activity className="w-5 h-5 text-cyber-cyan animate-spin mr-2" />
        INGESTING SIMULATION ENVIRONMENT DATA...
      </div>
    );
  }

  const defenses = getRecommendedDefenses(campaign.attackType);
  const mitreTechniques = getMitreTechniques(campaign.attackType);

  // Dynamic Impact Level Warning
  const getImpactLevel = (risk: number) => {
    if (risk > 70) return { label: "CRITICAL", color: "text-cyber-red border-cyber-red/30 bg-cyber-red/5" };
    if (risk > 40) return { label: "MEDIUM EXPOSURE", color: "text-amber-500 border-amber-500/30 bg-amber-500/5" };
    return { label: "LOW EXPOSURE", color: "text-cyber-green border-cyber-green/30 bg-cyber-green/5" };
  };
  const impact = getImpactLevel(campaign.riskFactor);

  return (
    <div className="relative min-h-screen bg-cyber-bg overflow-x-hidden pt-28 pb-16 flex flex-col justify-between selection:bg-electric-blue/30 selection:text-white">
      
      {/* Background radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[40vh] bg-electric-blue/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-1/4 w-[30vw] h-[30vh] bg-cyber-cyan/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Cyber Grid Decorators */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none z-0" />
      <div className="absolute inset-0 cyber-grid-fine opacity-50 pointer-events-none z-0" />

      {/* CRT Scanline Filter Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-10" />
      <div className="fixed inset-0 pointer-events-none z-50 animate-scanline bg-gradient-to-b from-transparent via-cyber-cyan/[0.012] to-transparent h-16 w-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex-grow">
        
        {/* Navigation Link */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <Link 
            href="/simulate" 
            className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400 hover:text-white uppercase transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Simulation Setup
          </Link>
          <Link
            href="/command-center"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-cyber-cyan/30 bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/20 text-[10px] font-mono tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:border-cyber-cyan/60"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Open Command Center
          </Link>
        </div>

        {/* Global Progress and Playback Control bar */}
        <div className="glassmorphism-card rounded-xl p-4 border border-cyber-border mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                isPlaying 
                  ? "bg-amber-500 text-black hover:bg-amber-400" 
                  : "bg-electric-blue text-white hover:bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            
            <button
              onClick={resetSimulation}
              className="w-9 h-9 rounded-full bg-cyber-surface border border-cyber-border hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase hidden sm:inline">
              {isPlaying ? "SIMULATION RUNNING" : progress === 100 ? "SIMULATION COMPLETED" : "SIMULATION PAUSED"}
            </span>
          </div>

          {/* Progress Bar or AI Analyst Action */}
          <div className="flex items-center gap-4">
            {progress === 100 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-4 flex-wrap"
              >
                <span className="text-[10px] font-mono text-cyber-green font-bold uppercase tracking-wider hidden sm:inline">
                  [TELEMETRY RECORDED]
                </span>
                <Link
                  href="/ai-analyst"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-electric-blue border border-electric-blue/50 text-xs font-mono font-bold tracking-widest text-white uppercase hover:bg-blue-600 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-300 animate-pulse cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5 text-cyber-cyan" />
                  Analyze with AI Analyst
                </Link>
              </motion.div>
            ) : (
              <>
                <span className="text-[10px] font-mono text-slate-400">COMPLETION: {progress}%</span>
                <div className="w-48 sm:w-64 h-2 bg-slate-950 border border-cyber-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-electric-blue to-cyber-cyan"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Overview, Timeline, recommended defenses (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Attack Overview Panel */}
            <div className="glassmorphism-card rounded-xl p-6 border border-cyber-border">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold mb-4">
                [01] CAMPAIGN CONFIGURATION OVERVIEW
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[10px]">
                <div className="bg-black/40 p-3 rounded border border-cyber-border">
                  <div className="text-slate-500 uppercase">Industry Target</div>
                  <div className="text-white font-bold mt-1 uppercase">{campaign.industry}</div>
                </div>
                <div className="bg-black/40 p-3 rounded border border-cyber-border">
                  <div className="text-slate-500 uppercase">Threat Actor</div>
                  <div className="text-white font-bold mt-1 uppercase">{campaign.threatActor}</div>
                </div>
                <div className="bg-black/40 p-3 rounded border border-cyber-border">
                  <div className="text-slate-500 uppercase">Attack Vector</div>
                  <div className="text-white font-bold mt-1 uppercase">{campaign.attackType}</div>
                </div>
                <div className="bg-black/40 p-3 rounded border border-cyber-border">
                  <div className="text-slate-500 uppercase">Defense Level</div>
                  <div className="text-white font-bold mt-1 uppercase">{campaign.securityLevel}</div>
                </div>
              </div>
            </div>

            {/* 2. Attack Playback Timeline (Sequential animation) */}
            <div className="glassmorphism-card rounded-xl p-6 border border-cyber-border">
              <div className="flex justify-between items-center border-b border-cyber-border/40 pb-4 mb-6">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                  [02] CYBER ATTACK MOVIE TIMELINE
                </span>
                <span className="text-[9px] font-mono text-cyber-cyan">ACTIVE PHASE: 0{currentStageIdx + 1}/06</span>
              </div>

              {/* Timeline Tree */}
              <div className="relative border-l border-cyber-border pl-6 space-y-6 ml-3">
                {campaign.stages.map((stage, idx) => {
                  const isActive = currentStageIdx === idx;
                  const isCompleted = currentStageIdx > idx;
                  const isPending = currentStageIdx < idx;

                  const getStatusBadge = (status: string) => {
                    if (status === "blocked") {
                      return <span className="px-1.5 py-0.5 rounded border border-cyber-green/30 bg-cyber-green/10 text-cyber-green text-[8px] font-mono font-bold uppercase">BLOCKED</span>;
                    }
                    return <span className="px-1.5 py-0.5 rounded border border-cyber-red/30 bg-cyber-red/10 text-cyber-red text-[8px] font-mono font-bold uppercase">EVADED</span>;
                  };

                  return (
                    <div 
                      key={stage.title}
                      className={`relative transition-all duration-500 ${
                        isPending ? "opacity-35 pointer-events-none" : "opacity-100"
                      }`}
                    >
                      {/* Interactive dot selector */}
                      <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                        isActive
                          ? "bg-black border-cyber-cyan shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                          : isCompleted
                          ? "bg-cyber-cyan border-cyber-cyan"
                          : "bg-slate-950 border-slate-800"
                      }`}>
                        {isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                        {isActive && <motion.span 
                          animate={{ scale: [1, 1.4, 1] }} 
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-1.5 h-1.5 rounded-full bg-cyber-cyan" 
                        />}
                      </span>

                      {/* Content Card */}
                      <div className={`p-4 rounded-lg border transition-all duration-300 ${
                        isActive 
                          ? "bg-cyber-surface border-cyber-border-active shadow-[0_0_20px_rgba(6,182,212,0.06)]"
                          : "bg-cyber-surface/30 border-cyber-border/30"
                      }`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500">PHASE 0{idx + 1}</span>
                            <span className="text-slate-700">|</span>
                            <span className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold uppercase ${
                              stage.severity === "critical" ? "text-cyber-red border-cyber-red/30 bg-cyber-red/5" :
                              stage.severity === "high" ? "text-rose-500 border-rose-500/30 bg-rose-500/5" :
                              "text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/5"
                            }`}>
                              {stage.severity}
                            </span>
                          </div>
                          {isCompleted || isActive ? getStatusBadge(stage.status) : (
                            <span className="text-[8px] font-mono text-slate-600 uppercase">PENDING</span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-white mt-2 font-mono uppercase tracking-wider">{stage.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans">{stage.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Dynamic Recommended Defenses */}
            <div className="glassmorphism-card rounded-xl p-6 border border-cyber-border">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold mb-4">
                [03] RECOMMENDED SECURITY MITIGATION SUITE
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {defenses.map((def, idx) => (
                  <div key={idx} className="bg-cyber-surface/40 border border-cyber-border p-4 rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-cyber-cyan font-mono text-[10px] uppercase font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        RULE {idx + 1}
                      </div>
                      <h4 className="text-xs font-bold text-white font-mono uppercase mt-2">{def.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-sans leading-relaxed">{def.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Side: Risk indicators, live logs terminal, MITRE matrix (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* 1. Risk Assessment Panel */}
            <div className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-cyber-red/5 rounded-full blur-[60px] pointer-events-none" />
              
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold mb-4">
                [04] TACTICAL COMPROMISE TELEMETRY
              </span>

              {/* Progress gauge dial */}
              <div className="flex items-center justify-between gap-6 border-b border-cyber-border/40 pb-5 mb-5">
                <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="rgba(30,41,59,0.5)" strokeWidth="6" fill="transparent" />
                    <motion.circle 
                      cx="56" cy="56" r="48" 
                      stroke={campaign.riskFactor > 70 ? "#f43f5e" : campaign.riskFactor > 40 ? "#f59e0b" : "#3b82f6"} 
                      strokeWidth="7" fill="transparent"
                      strokeDasharray={2 * Math.PI * 48}
                      animate={{ strokeDashoffset: (2 * Math.PI * 48) * (1 - campaign.riskFactor / 100) }}
                      transition={{ duration: 0.8 }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-xl font-bold font-mono text-white">{campaign.riskFactor}%</div>
                    <div className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">Risk</div>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-[10px] flex-grow">
                  <div className="flex justify-between items-center bg-black/40 p-2 border border-cyber-border rounded">
                    <span className="text-slate-500">BREACH PROBABILITY</span>
                    <span className="text-white font-bold">{campaign.compromiseChance}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/40 p-2 border border-cyber-border rounded">
                    <span className="text-slate-500">IMPACT LEVEL</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold ${impact.color}`}>
                      {impact.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Subnets indicators */}
              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between text-slate-500">
                  <span>SEGMENT: BOUNDARY GATEWAY</span>
                  <span className={currentStageIdx >= 1 ? "text-cyber-red font-bold" : "text-cyber-green font-bold"}>
                    {currentStageIdx >= 1 ? "COMPROMISED" : "SECURED"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SEGMENT: INTERNAL JUMP ROUTE</span>
                  <span className={currentStageIdx >= 3 ? "text-cyber-red font-bold" : "text-cyber-green font-bold"}>
                    {currentStageIdx >= 3 ? "COMPROMISED" : "SECURED"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>DATABASE: {campaign.primaryTarget}</span>
                  <span className={currentStageIdx >= 5 ? "text-cyber-red font-bold animate-pulse" : "text-cyber-green font-bold"}>
                    {currentStageIdx >= 5 ? "BREACHED" : "SECURED"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Live Terminal Log Panel (Streams logs) */}
            <div className="glassmorphism-card rounded-xl border border-cyber-border overflow-hidden glow-blue">
              <div className="bg-cyber-surface px-4 py-2 border-b border-cyber-border flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5 uppercase font-bold">
                  <Terminal className="w-3.5 h-3.5 text-cyber-cyan" />
                  live-attack-propagation-feed.log
                </span>
                <span className="text-cyber-cyan animate-pulse">STREAM ACTIVE</span>
              </div>

              {/* Logs Screen */}
              <div className="bg-black/90 p-4 font-mono text-[10px] text-slate-400 h-[260px] overflow-y-auto space-y-1.5">
                {terminalLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-center uppercase">
                    Initializing logs stream player...
                  </div>
                ) : (
                  terminalLogs.map((log, idx) => {
                    const isSystem = log.includes("[STAGE DONE]") || log.includes("[COMPLETE]");
                    return (
                      <div 
                        key={idx} 
                        className={`leading-relaxed ${
                          isSystem ? "text-cyber-cyan font-bold" : "text-slate-400"
                        }`}
                      >
                        <span className="text-slate-700 mr-1.5">&gt;</span>
                        {log}
                      </div>
                    );
                  })
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* 3. MITRE ATT&CK Mapping Matrix */}
            <div className="glassmorphism-card rounded-xl p-6 border border-cyber-border">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold mb-4">
                [05] MITRE ATT&CK MAPPED ACTIONS
              </span>
              
              <div className="space-y-2.5 font-mono text-[10px]">
                {mitreTechniques.map((tech) => (
                  <div 
                    key={tech.id} 
                    className="p-2.5 rounded bg-cyber-surface/40 border border-cyber-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-cyber-cyan font-bold border border-cyber-cyan/30 px-1.5 py-0.5 rounded bg-cyber-cyan/5">
                        {tech.id}
                      </span>
                      <span className="text-white font-bold uppercase">{tech.name}</span>
                    </div>
                    <span className="text-slate-500 uppercase text-[9px]">{tech.category}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-6 w-full text-slate-600 font-mono text-[9px] tracking-wider border-t border-cyber-border/20 pt-6 mt-12 flex justify-between items-center z-10">
        <div>CORE MONITOR: attack-viewer.aegis.local</div>
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyber-cyan" />
          <span>SYS_TELEMETRY: PROCESSING ACTIVE INTRUSION MOVIE</span>
        </div>
      </footer>

    </div>
  );
}
