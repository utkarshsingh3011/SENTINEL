"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Terminal, Brain, ShieldAlert, ShieldCheck, 
  Layers, AlertTriangle, FileText, Download, Printer, 
  ChevronRight, TrendingUp, Shield, Cpu, Activity, Clock
} from "lucide-react";
import { 
  getCampaignHistory, StoredCampaign, getActorName, 
  getAttackName, getIndustryName, CampaignStage 
} from "../../components/campaignStore";

// Fallback campaign configuration
const DEFAULT_ANALYST_CAMPAIGN: StoredCampaign = {
  id: "SIM-FALLBACK",
  timestamp: new Date().toISOString(),
  threatActor: "Lazarus",
  industry: "Banking",
  attackType: "Supply Chain",
  riskScore: 54,
  status: "Successful",
  securityLevel: "Medium",
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

// MITRE ATT&CK techniques mapper
const getMitreAttackMapping = (attackType: string, stageIdx: number) => {
  const mappings: Record<string, { code: string; name: string }[]> = {
    Phishing: [
      { code: "T1595", name: "Active Scanning (Reconnaissance)" },
      { code: "T1566.002", name: "Spearphishing Link (Initial Access)" },
      { code: "T1003.001", name: "LSASS Memory Dump (Credential Access)" },
      { code: "T1021", name: "Remote Services (Lateral Movement)" },
      { code: "T1134", name: "Access Token Manipulation (Privilege Escalation)" },
      { code: "T1041", name: "Exfiltration Over C2 Channel (Exfiltration)" },
    ],
    Ransomware: [
      { code: "T1046", name: "Network Service Scanning (Reconnaissance)" },
      { code: "T1566.001", name: "Spearphishing Attachment (Initial Access)" },
      { code: "T1003.001", name: "LSASS Memory Dump (Credential Access)" },
      { code: "T1021.001", name: "Remote Desktop Protocol (Lateral Movement)" },
      { code: "T1482", name: "Domain Trust Discovery (Privilege Escalation)" },
      { code: "T1486", name: "Data Encrypted for Impact (Impact/Ransomware)" },
    ],
    DDoS: [
      { code: "T1595.002", name: "Vulnerability Scanning (Reconnaissance)" },
      { code: "T1190", name: "Exploit Public-Facing Application (Initial Access)" },
      { code: "T1555", name: "Credentials from Password Stores (Credential Access)" },
      { code: "T1021", name: "Remote Services (Lateral Movement)" },
      { code: "T1068", name: "Exploitation for Privilege Escalation (Privilege Escalation)" },
      { code: "T1498.001", name: "Direct Volumetric Flood (Impact/DDoS)" },
    ],
    "Supply Chain": [
      { code: "T1595", name: "Active Scanning (Reconnaissance)" },
      { code: "T1195.002", name: "Supply Chain Compromise (Initial Access)" },
      { code: "T1003.001", name: "LSASS Memory Dump (Credential Access)" },
      { code: "T1570", name: "Lateral Tool Transfer (Lateral Movement)" },
      { code: "T1134", name: "Access Token Manipulation (Privilege Escalation)" },
      { code: "T1041", name: "Exfiltration Over C2 Channel (Exfiltration)" },
    ],
    "SQL Injection": [
      { code: "T1595.002", name: "Vulnerability Scanning (Reconnaissance)" },
      { code: "T1190", name: "Exploit Public-Facing Application (Initial Access)" },
      { code: "T1555.003", name: "Credentials from Web Browsers (Credential Access)" },
      { code: "T1021.004", name: "SSH Remote Session (Lateral Movement)" },
      { code: "T1068", name: "Exploitation for Privilege Escalation (Privilege Escalation)" },
      { code: "T1041", name: "Exfiltration Over C2 Channel (Exfiltration)" },
    ],
  };

  const list = mappings[attackType] || mappings["Phishing"];
  return list[stageIdx] || { code: "T1059", name: "Command and Scripting Interpreter" };
};

// CTI Report Generator
const generateCTIReport = (campaign: StoredCampaign) => {
  const actor = getActorName(campaign.threatActor);
  const vector = getAttackName(campaign.attackType);
  const industry = getIndustryName(campaign.industry);
  const target = campaign.primaryTarget;
  const isBlocked = campaign.status === "Blocked";

  // 1. Executive Summary
  let execSummary = "";
  if (isBlocked) {
    execSummary = `A simulated adversary campaign emulating ${actor} tactics was launched against the ${industry} network segments targeting the core ${target} asset. The campaign deployed a ${vector} attack vector to establish initial access. Aegis defensive configurations, operating at a ${campaign.securityLevel} zero-trust posture, successfully flagged, contained, and blocked the intrusion steps. EDR agents executed localized block policies, preventing lateral movement propagation and data exfiltration. The target data remains secure, and system defenses operated as designed.`;
  } else {
    execSummary = `A critical security compromise was logged during a simulated adversary campaign emulating ${actor} tactics against the ${industry} production network. Utilizing a ${vector} intrusion vector, the adversary successfully bypassed edge firewalls, established a command-and-control (C2) communications channel, and executed credential harvesting dumps. Subsequent lateral pivoting allowed full compromise of the primary database target ${target}. Critical database tables were compressed and exfiltrated over non-standard ports. EDR telemetry failed to block core escalations, indicating severe monitoring gaps.`;
  }

  // 2. Threat Actor Profile
  let actorProfile = "";
  if (campaign.threatActor === "APT29") {
    actorProfile = "APT29 (also known as CozyBear) is a state-sponsored advanced persistent threat group known for stealthy, long-term intelligence operations. They typically target government entities, foreign ministries, and critical research infrastructure. Their operational profile focuses heavily on defense evasion, utilizing spearphishing campaigns carrying weaponized attachments, API token hijacking, and custom backdoor loaders. APT29 prioritizes credential theft and lateral pivoting to establish persistent footholds while keeping log signatures minimal.";
  } else if (campaign.threatActor === "Lazarus") {
    actorProfile = "Lazarus Group is a state-sponsored cyber warfare actor famous for highly destructive attacks, financial cyber-heists, and cryptocurrency network infiltrations. Lazarus employs diverse, aggressive tactics, ranging from Blind SQL Injection on database services to weaponized supply chain dependencies. Their campaigns are characterized by rapid propagation, custom network evasion tunnels, and the deployment of wiper malware. Lazarus exhibits high operational flexibility and will pivot quickly to exfiltration or system ransom.";
  } else if (campaign.threatActor === "LockBit") {
    actorProfile = "LockBit 3.0 is one of the most prolific Ransomware-as-a-Service (RaaS) syndicates globally. Operating on a double-extortion model, they exfiltrate sensitive corporate databases before triggering local file encryption. LockBit targets commercial entities, municipal backbones, and healthcare infrastructures. They utilize automated network scanners, lateral service transfers, and memory dump scripts to steal administrative domain controller tokens. LockBit leverages aggressive double-extortion leak sites as leverage for payout.";
  } else if (campaign.threatActor === "FIN7") {
    actorProfile = "FIN7 is a highly organized, financially motivated cybercriminal syndicate specializing in targeting point-of-sale (POS) environments, corporate billing pipelines, and financial ledger services. FIN7 relies heavily on spearphishing campaigns with highly polished social engineering scripts. They deploy modular malware backdoors and memory scrapers to capture domain keys. FIN7 typically monitors compromised networks for weeks to map financial systems before executing final asset theft.";
  } else {
    actorProfile = "Anonymous is a decentralized, global hacktivist collective specializing in public-facing service disruptions, volumetric packet floods, and public data leaks. Their operational focus is ideological rather than financial, targeting public corporate portals and Registrarstudent backends. They utilize open-source stressor tools to execute volumetric DDoS packet floods and exploit SQL flaws on vulnerable web applications to leak customer lists. Anonymous actions are designed to cause maximum reputational damage.";
  }

  // 3. Business Impact Assessment
  let financialLoss = "";
  let operationalImpact = "";
  let downtime = "";

  if (campaign.industry === "Banking") {
    financialLoss = isBlocked ? "$45,000 (Incident Response & Forensic Audit)" : "$6,800,000 (Direct ledger liabilities, SWIFT penalty fines, and compliance litigation)";
    operationalImpact = isBlocked ? "Negligible. Security Operations isolated target hosts within 15 minutes." : "Severe. SWIFT ledger operations suspended. Customer portals taken offline for 48 hours for data sanitization.";
    downtime = isBlocked ? "0 Hours" : "48 Hours";
  } else if (campaign.industry === "Healthcare") {
    financialLoss = isBlocked ? "$35,000 (SIEM log analysis and EDR updates)" : "$4,200,000 (HIPAA regulatory fines, medical class-action lawsuits, and forensic remediation)";
    operationalImpact = isBlocked ? "None. Patient databases remained isolated behind active EDR rules." : "Critical. Electronic Medical Record (EMR) systems locked. Telemedicine and scheduling nodes offline, forcing manual triage protocols.";
    downtime = isBlocked ? "0 Hours" : "24 Hours";
  } else if (campaign.industry === "Government") {
    financialLoss = isBlocked ? "$20,000 (Threat intelligence feeds and patching)" : "$9,500,000 (National security audit, backup server rebuilds, and identity recovery funding)";
    operationalImpact = isBlocked ? "Negligible. Gateway firewall rules dropped all C2 exfiltration attempts." : "High. Secure federal registry directories compromised. Government agency backup storage arrays corrupted.";
    downtime = isBlocked ? "0 Hours" : "72 Hours";
  } else if (campaign.industry === "University") {
    financialLoss = isBlocked ? "$15,000 (Infrastructure scan and token reset)" : "$1,800,000 (FERPA privacy violations, research patent litigation, and system recovery)";
    operationalImpact = isBlocked ? "None. Network micro-segmentation blocked access to registrar NAS arrays." : "Moderate. Registrar portal taken offline. Research file shares encrypted, disrupting ongoing scientific projects.";
    downtime = isBlocked ? "0 Hours" : "36 Hours";
  } else { // Startup
    financialLoss = isBlocked ? "$12,000 (Cloud security configuration review)" : "$1,500,000 (Production API key exposure, customer churn liabilities, and Kubernetes rebuilding costs)";
    operationalImpact = isBlocked ? "Negligible. API rate-limiting successfully contained the intrusion source." : "Critical. Kubernetes master cluster compromised. Production API tokens exposed, requiring immediate revocation of all client keys.";
    downtime = isBlocked ? "0 Hours" : "18 Hours";
  }

  // 4. Recommended Defenses
  const mitigations = [];
  if (campaign.attackType === "Phishing") {
    mitigations.push("Mandate FIDO2-compliant hardware security keys (e.g. YubiKeys) for all employee access points to eliminate credential phishing vectors.");
    mitigations.push("Deploy advanced email sandbox systems with heuristic link evaluation to detonate weaponized URL payloads before inbox delivery.");
    mitigations.push("Enforce strict host credential guard controls in Windows registry to block LSASS memory dumping tools like Mimikatz.");
  } else if (campaign.attackType === "Ransomware") {
    mitigations.push("Establish air-gapped, immutable write-once read-many (WORM) offline backup vaults to guarantee rapid recovery without ransom payments.");
    mitigations.push("Implement strict Active Directory service account limits and disable administrative shares (Admin$, C$) on endpoints.");
    mitigations.push("Deploy heuristic EDR ransomware canary file monitoring to detect and auto-block rapid cryptographic write file patterns.");
  } else if (campaign.attackType === "DDoS") {
    mitigations.push("Deploy global edge traffic scrubbing services (e.g. Cloudflare Magic Transit) to absorb volumetric UDP/TCP floods.");
    mitigations.push("Configure strict API gateway rate-limiting and connection throttling rules on public-facing internet routing boundaries.");
    mitigations.push("Configure CDN caching rules on all static web elements to buffer application servers against packet depletion loads.");
  } else if (campaign.attackType === "Supply Chain") {
    mitigations.push("Mandate checksum validation and SHA-256 cryptographic pinning for all external packages inside build deployment pipelines.");
    mitigations.push("Establish a localized private software package repository and run automated vulnerability scanners (e.g. Snyk) on all dependencies.");
    mitigations.push("Enforce strict egress firewall filtering, blocking server nodes from initiating unauthorized outbound internet connections.");
  } else { // SQL Injection
    mitigations.push("Upgrade software frameworks to mandate parameterized SQL queries and object-relational mapping (ORM) across database queries.");
    mitigations.push("Deploy a Web Application Firewall (WAF) with active SQL injection signature blocking profiles on edge API endpoints.");
    mitigations.push("Apply the principle of least privilege to database users, disabling file-system access (e.g. xp_cmdshell) and dropping unnecessary permissions.");
  }

  // 5. Risk Reduction metrics
  const currentRisk = isBlocked ? campaign.riskScore : Math.max(70, campaign.riskScore);
  const projectedRisk = 5;
  const riskReduction = Math.max(0, currentRisk - projectedRisk);

  return {
    id: campaign.id,
    timestamp: campaign.timestamp,
    actorName: actor,
    actorId: campaign.threatActor,
    vectorName: vector,
    vectorId: campaign.attackType,
    industryName: industry,
    targetName: target,
    status: campaign.status,
    securityLevel: campaign.securityLevel,
    executiveSummary: execSummary,
    actorProfile,
    financialLoss,
    operationalImpact,
    downtime,
    mitigations,
    currentRisk,
    projectedRisk,
    riskReduction,
    stages: campaign.stages,
  };
};

function AIAnalystContent() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaignId");

  const [campaign, setCampaign] = useState<StoredCampaign | null>(null);
  const [reportData, setReportData] = useState<ReturnType<typeof generateCTIReport> | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [activeMenuSection, setActiveMenuSection] = useState("exec-summary");

  useEffect(() => {
    // 1. Load Campaign
    const history = getCampaignHistory();
    let resolvedCampaign: StoredCampaign | null = null;

    if (campaignId) {
      resolvedCampaign = history.find(c => c.id === campaignId) || null;
    }

    if (!resolvedCampaign && typeof window !== "undefined") {
      const saved = sessionStorage.getItem("aegis_campaign_config");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Map to stored campaign format
          resolvedCampaign = {
            id: parsed.id || `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: parsed.timestamp || new Date().toISOString(),
            threatActor: parsed.threatActor,
            industry: parsed.industry,
            attackType: parsed.attackType,
            riskScore: parsed.riskFactor !== undefined ? parsed.riskFactor : 50,
            status: parsed.stages && parsed.stages[parsed.stages.length - 1]?.status === "blocked" ? "Blocked" : "Successful",
            securityLevel: parsed.securityLevel || "Medium",
            primaryTarget: parsed.primaryTarget || "Unknown-Target",
            stages: parsed.stages || [],
          };
        } catch {
          // fallback
        }
      }
    }

    if (!resolvedCampaign) {
      resolvedCampaign = history[0] || DEFAULT_ANALYST_CAMPAIGN;
    }

    setCampaign(resolvedCampaign);
    setReportData(generateCTIReport(resolvedCampaign));

    // UTC clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [campaignId]);

  // Export report to Markdown
  const handleExportMarkdown = () => {
    if (!reportData) return;
    const dateStr = new Date(reportData.timestamp).toUTCString();
    
    const mitreMappingStr = reportData.stages.map((stage, idx) => {
      const mapping = getMitreAttackMapping(reportData.vectorId, idx);
      return `Phase ${idx+1}: ${stage.title} -> MITRE ATT&CK: ${mapping.code} [${mapping.name}] - Status: ${stage.status.toUpperCase()}`;
    }).join("\n");

    const content = `# AEGIS CYBER THREAT INTELLIGENCE (CTI) REPORT
Generated: ${new Date().toUTCString()}
Campaign Reference: ${reportData.id}
Telemetry Log Time: ${dateStr}

======================================================================
1. EXECUTIVE SUMMARY
----------------------------------------------------------------------
${reportData.executiveSummary}

======================================================================
2. ADVERSARY INTEL: ${reportData.actorName.toUpperCase()} PROFILE
----------------------------------------------------------------------
${reportData.actorProfile}

======================================================================
3. MITRE ATT&CK TACTICS & TECHNIQUES MAPPING
----------------------------------------------------------------------
${mitreMappingStr}

======================================================================
4. BUSINESS IMPACT ASSESSMENT
----------------------------------------------------------------------
Adversary Target Endpoint: ${reportData.targetName}
Operational Downtime: ${reportData.downtime}
Financial Liability Impact: ${reportData.financialLoss}
Core Infrastructure Impact: ${reportData.operationalImpact}

======================================================================
5. RECOMMENDED CYBER DEFENSES & REMEDIATIONS
----------------------------------------------------------------------
${reportData.mitigations.map((mit, i) => `${i + 1}. [Mitigation] ${mit}`).join("\n")}

======================================================================
6. RISK REDUCTION PROJECTIONS
----------------------------------------------------------------------
Current Infrastructure Risk: ${reportData.currentRisk}%
Projected Risk Post-Remediation: < 5%
Net Security Posture Risk Reduction: ${reportData.riskReduction}%

======================================================================
Report Generated Authenticated by Aegis AI Security Core Node
VERIFICATION TELEMETRY: COMPLETED // DEFENSE BLOCK STATUS: ${reportData.status.toUpperCase()}
`;
    
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AEGIS-CTI-Report-${reportData.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!reportData || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-bg text-cyber-cyan font-mono text-xs uppercase tracking-widest">
        Compiling Telemetry Logs...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-cyber-bg text-slate-100 selection:bg-electric-blue/30 selection:text-white print:bg-white print:text-black">
      {/* Background elements - hidden on print */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none z-0 print:hidden" />
      <div className="absolute inset-0 cyber-grid-fine opacity-50 pointer-events-none z-0 print:hidden" />
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-10 print:hidden" />
      <div className="fixed inset-0 pointer-events-none z-50 animate-scanline bg-gradient-to-b from-transparent via-cyber-cyan/[0.012] to-transparent h-16 w-full print:hidden" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex-grow pt-8 pb-12 print:pt-0">
        
        {/* Navigation back and telemetry info - hidden on print */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4 print:hidden">
          <Link 
            href="/command-center" 
            className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400 hover:text-white uppercase transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Command Center
          </Link>

          <div className="flex items-center gap-4 text-[10px] font-mono tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-cyber-border bg-black/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-cyan"></span>
              </span>
              AI INTEL PARSER
            </span>
            <span className="text-cyber-cyan">{currentTime || "00:00:00 UTC"}</span>
          </div>
        </div>

        {/* Title Header - print:hidden */}
        <div className="mb-10 max-w-4xl print:hidden">
          <div className="inline-flex items-center gap-2 text-cyber-cyan text-[10px] font-mono tracking-widest uppercase mb-4">
            <Brain className="w-3.5 h-3.5 text-cyber-cyan" />
            Adversary TTP Synthesizer: threat-intelligence-brief.exe
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase">
            AI Threat Analyst Console
          </h1>
          <p className="mt-4 text-slate-400 text-sm md:text-base leading-relaxed">
            Automated intelligence synthesizer compile adversary tactics, techniques, and procedures (TTPs). Review the generated Cyber Threat Intelligence report, audit financial risk exposures, and export execution scripts.
          </p>
        </div>

        {/* Action Controls - hidden on print */}
        <div className="glassmorphism-card rounded-xl p-4 border border-cyber-border mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="text-slate-400">TARGET REF:</span>
            <span className="text-white font-bold">{reportData.id}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">ACTOR:</span>
            <span className="text-white font-bold uppercase">{reportData.actorName}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">OUTCOME:</span>
            <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase ${
              reportData.status === "Blocked"
                ? "border-cyber-green/30 bg-cyber-green/10 text-cyber-green"
                : "border-cyber-red/30 bg-cyber-red/10 text-cyber-red"
            }`}>
              {reportData.status}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-cyber-border bg-cyber-surface hover:bg-cyber-surface-brighter hover:text-white text-slate-300 text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-cyber-cyan/35 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Report (.md)
            </button>
          </div>
        </div>

        {/* Print Only Header: Visible only during browser print */}
        <div className="hidden print:block font-mono text-black border-b-2 border-black pb-4 mb-8">
          <h1 className="text-2xl font-bold uppercase">AEGIS Cyber Threat Intelligence (CTI) Report</h1>
          <div className="grid grid-cols-2 gap-4 text-[10px] mt-2">
            <div><strong>Report Reference:</strong> {reportData.id}</div>
            <div><strong>Adversary Node:</strong> {reportData.actorName}</div>
            <div><strong>Vector Profile:</strong> {reportData.vectorName}</div>
            <div><strong>Target Entity:</strong> {reportData.industryName} ({reportData.targetName})</div>
            <div><strong>Simulation Status:</strong> {reportData.status.toUpperCase()}</div>
            <div><strong>Timestamp:</strong> {new Date(reportData.timestamp).toUTCString()}</div>
          </div>
        </div>

        {/* Report Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Menu - hidden on print */}
          <div className="lg:col-span-3 space-y-3 font-mono print:hidden">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold mb-4">
              [ REPORT SECTIONS ]
            </span>
            {[
              { id: "exec-summary", label: "Executive Summary", icon: FileText },
              { id: "threat-actor", label: "Threat Actor Profile", icon: ShieldAlert },
              { id: "mitre-mapping", label: "MITRE ATT&CK Mapping", icon: Layers },
              { id: "business-impact", label: "Business Impact", icon: AlertTriangle },
              { id: "recommended-defenses", label: "Recommended Defenses", icon: Shield },
              { id: "risk-reduction", label: "Risk Reduction Projections", icon: TrendingUp }
            ].map(sec => {
              const Icon = sec.icon;
              const isActive = activeMenuSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveMenuSection(sec.id);
                    document.getElementById(sec.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded border text-left text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                    isActive
                      ? "border-cyber-cyan/50 bg-cyber-cyan/10 text-cyber-cyan font-bold"
                      : "border-cyber-border bg-black/20 text-slate-400 hover:text-white hover:bg-slate-900/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {sec.label}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${isActive ? "translate-x-0.5" : ""}`} />
                </button>
              );
            })}
          </div>

          {/* Main Report Document Sheet (9 cols) */}
          <div className="lg:col-span-9 space-y-8 print:col-span-12 print:space-y-6">
            
            {/* 1. Executive Summary */}
            <motion.section 
              id="exec-summary"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative print:border-none print:shadow-none print:p-0"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent print:hidden" />
              <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-3 mb-4 font-mono">
                <FileText className="w-4 h-4 text-cyber-cyan print:text-black" />
                <h3 className="text-white font-bold text-xs uppercase tracking-widest print:text-black">
                  [1.0] EXECUTIVE SUMMARY
                </h3>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed font-mono print:text-black print:text-[10px]">
                {reportData.executiveSummary}
              </p>
            </motion.section>

            {/* 2. Threat Actor Profile */}
            <motion.section 
              id="threat-actor"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative print:border-none print:shadow-none print:p-0"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent print:hidden" />
              <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-3 mb-4 font-mono">
                <ShieldAlert className="w-4 h-4 text-cyber-cyan print:text-black" />
                <h3 className="text-white font-bold text-xs uppercase tracking-widest print:text-black">
                  [2.0] THREAT ADVERSARY INTEL: {reportData.actorName}
                </h3>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed font-mono print:text-black print:text-[10px]">
                {reportData.actorProfile}
              </p>
            </motion.section>

            {/* 3. MITRE ATT&CK Mapping */}
            <motion.section 
              id="mitre-mapping"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative print:border-none print:shadow-none print:p-0"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent print:hidden" />
              <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-3 mb-4 font-mono">
                <Layers className="w-4 h-4 text-cyber-cyan print:text-black" />
                <h3 className="text-white font-bold text-xs uppercase tracking-widest print:text-black">
                  [3.0] MITRE ATT&CK TACTICS & TECHNIQUES MAPPING
                </h3>
              </div>
              <p className="text-slate-400 text-[10px] font-mono mb-4 print:hidden">
                Adversary propagation mapping mapped directly to MITRE enterprise matrix identifiers.
              </p>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left font-mono text-[9px] print:text-[8px]">
                  <thead>
                    <tr className="border-b border-cyber-border/50 text-slate-500 print:text-black">
                      <th className="pb-2 uppercase">Intrusion Phase</th>
                      <th className="pb-2 uppercase">Technique Code</th>
                      <th className="pb-2 uppercase">MITRE Technique Name</th>
                      <th className="pb-2 uppercase text-right">EDR Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/20 print:divide-black/20">
                    {reportData.stages.map((stage, idx) => {
                      const mapping = getMitreAttackMapping(reportData.vectorId, idx);
                      return (
                        <tr key={idx} className="hover:bg-slate-900/10 transition-colors">
                          <td className="py-2 text-white font-bold uppercase print:text-black">{stage.title}</td>
                          <td className="py-2 text-cyber-cyan font-bold print:text-black">{mapping.code}</td>
                          <td className="py-2 text-slate-400 print:text-black">{mapping.name}</td>
                          <td className="py-2 text-right">
                            <span className={`px-1 py-0.5 rounded border text-[7px] font-bold uppercase inline-block ${
                              stage.status === "blocked" 
                                ? "border-cyber-green/30 bg-cyber-green/5 text-cyber-green print:border-black print:text-black"
                                : "border-cyber-red/30 bg-cyber-red/5 text-cyber-red print:border-black print:text-black"
                            }`}>
                              {stage.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.section>

            {/* 4. Business Impact Assessment */}
            <motion.section 
              id="business-impact"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative print:border-none print:shadow-none print:p-0"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent print:hidden" />
              <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-3 mb-4 font-mono">
                <AlertTriangle className="w-4 h-4 text-cyber-cyan print:text-black" />
                <h3 className="text-white font-bold text-xs uppercase tracking-widest print:text-black">
                  [4.0] BUSINESS IMPACT ASSESSMENT
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
                <div className="bg-black/35 p-4 rounded border border-cyber-border text-left print:bg-white print:border-black print:p-2">
                  <span className="text-slate-500 text-[8px] uppercase tracking-wider block print:text-black">FINANCIAL LIABILITY</span>
                  <div className="text-cyber-red text-base font-extrabold mt-1 uppercase print:text-black print:text-xs">
                    {reportData.financialLoss.split(" ")[0]}
                  </div>
                  <p className="text-slate-400 text-[8px] mt-2 leading-relaxed print:text-black">
                    {reportData.financialLoss.substring(reportData.financialLoss.indexOf("("))}
                  </p>
                </div>

                <div className="bg-black/35 p-4 rounded border border-cyber-border text-left print:bg-white print:border-black print:p-2">
                  <span className="text-slate-500 text-[8px] uppercase tracking-wider block print:text-black">OPERATIONAL DOWNTIME</span>
                  <div className="text-cyber-cyan text-base font-extrabold mt-1 uppercase print:text-black print:text-xs">
                    {reportData.downtime}
                  </div>
                  <p className="text-slate-400 text-[8px] mt-2 leading-relaxed print:text-black">
                    Estimated restoration time for localized network segments.
                  </p>
                </div>

                <div className="bg-black/35 p-4 rounded border border-cyber-border text-left print:bg-white print:border-black print:p-2">
                  <span className="text-slate-500 text-[8px] uppercase tracking-wider block print:text-black">INFRASTRUCTURE IMPACT</span>
                  <div className="text-white text-xs font-bold mt-1 uppercase print:text-black">
                    {reportData.operationalImpact.split(".")[0]}
                  </div>
                  <p className="text-slate-400 text-[8px] mt-2 leading-relaxed print:text-black">
                    {reportData.operationalImpact.split(".").slice(1).join(".")}
                  </p>
                </div>
              </div>
            </motion.section>

            {/* 5. Recommended Defenses */}
            <motion.section 
              id="recommended-defenses"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative print:border-none print:shadow-none print:p-0"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent print:hidden" />
              <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-3 mb-4 font-mono">
                <Shield className="w-4 h-4 text-cyber-cyan print:text-black" />
                <h3 className="text-white font-bold text-xs uppercase tracking-widest print:text-black">
                  [5.0] RECOMMENDED CYBER REMEDIATION PLAYBOOK
                </h3>
              </div>

              <div className="space-y-4 font-mono text-[10px] print:text-[9px]">
                {reportData.mitigations.map((mit, i) => (
                  <div key={i} className="flex gap-3 bg-black/20 p-3 rounded border border-cyber-border print:bg-white print:border-black print:p-2">
                    <div className="w-5 h-5 rounded-full bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan flex items-center justify-center font-bold text-[9px] shrink-0 print:border-black print:text-black print:bg-slate-200">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-bold uppercase print:text-black">Adversary Mitigation Action</h4>
                      <p className="text-slate-400 mt-1 leading-relaxed print:text-black">{mit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* 6. Risk Reduction Projections */}
            <motion.section 
              id="risk-reduction"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative print:border-none print:shadow-none print:p-0"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent print:hidden" />
              <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-3 mb-4 font-mono">
                <TrendingUp className="w-4 h-4 text-cyber-cyan print:text-black" />
                <h3 className="text-white font-bold text-xs uppercase tracking-widest print:text-black">
                  [6.0] QUANTITATIVE RISK REDUCTION ESTIMATE
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4 font-mono text-[10px]">
                  <p className="text-slate-400 leading-relaxed print:text-black">
                    Comparison profiling threat compromise ratios. Implementing playbooks reduces compromise probabilities to a negligible index.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-slate-400 print:text-black">
                      <span>PRE-MITIGATION COMPROMISE PROBABILITY:</span>
                      <span className="text-cyber-red print:text-black">{reportData.currentRisk}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 border border-cyber-border rounded-full overflow-hidden print:border-black print:bg-slate-200">
                      <div className="h-full bg-cyber-red print:bg-black" style={{ width: `${reportData.currentRisk}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-slate-400 print:text-black">
                      <span>POST-MITIGATION PROBABILITY:</span>
                      <span className="text-cyber-green print:text-black">&lt; {reportData.projectedRisk}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 border border-cyber-border rounded-full overflow-hidden print:border-black print:bg-slate-200">
                      <div className="h-full bg-cyber-green print:bg-black" style={{ width: `${reportData.projectedRisk}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 border border-cyber-border bg-black/40 rounded print:border-black print:bg-white print:p-2">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest print:text-black">CALCULATED RISK MITIGATION INDEX</span>
                  <motion.div 
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-4xl md:text-5xl font-extrabold font-mono text-cyber-cyan mt-2 print:text-black"
                  >
                    -{reportData.riskReduction}%
                  </motion.div>
                  <span className="text-[8px] font-mono text-cyber-green uppercase tracking-widest font-bold mt-1 print:text-black">POST-REMEDIATION SAFETY RANGE</span>
                </div>
              </div>
            </motion.section>

          </div>
        </div>
      </div>

      {/* Footer - hidden on print */}
      <footer className="relative bg-black border-t border-cyber-border/40 py-10 z-10 overflow-hidden mt-12 print:hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 font-mono text-[9px] tracking-wider uppercase">
          <div>
            <span className="text-white font-bold tracking-[0.2em]">AEGIS PLATFORM COMMAND</span>
            <span className="ml-2">© {new Date().getFullYear()} AEGIS Cyber Inc.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-green"></span>
            </span>
            <span>INTEL ENCRYPT SYNC: COMPLETED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AIAnalystPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cyber-bg text-cyber-cyan font-mono text-xs uppercase tracking-widest">
        <div className="flex flex-col items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyber-cyan"></span>
          </span>
          Initializing Threat Intel Analyst Console...
        </div>
      </div>
    }>
      <AIAnalystContent />
    </Suspense>
  );
}
