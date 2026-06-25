"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import JourneyStepper from "../../components/JourneyStepper";
import Footer from "../../components/Footer";
import {
  ArrowLeft, Brain, ShieldAlert, Layers, AlertTriangle,
  FileText, Download, Printer, ChevronRight, TrendingUp, Shield,
  CheckCircle2, AlertOctagon, Info, Share2, Lock, Eye, Mail, Key, ShieldCheck, Terminal, Activity
} from "lucide-react";
import {
  getCampaignHistory, StoredCampaign, getActorName,
  getAttackName, getIndustryName, CampaignStage, getSecurityLevelName
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
      title: "Scanning the Network",
      description: "Attacker scanned the network to find active computers and open ports.",
      log: "[RECON] Scan complete. Found open ports: 443, 8080. EDR status: BLOCKED",
      status: "blocked",
      severity: "low",
    },
    {
      title: "Attacker Gained Access",
      description: "Attacker established a foothold in the network, bypassing outer defenses.",
      log: "[INGRESS] Entry payload executed. Connection established with target device. EDR status: BLOCKED",
      status: "blocked",
      severity: "medium",
    },
    {
      title: "Passwords Were Stolen",
      description: "Attacker searched computer memory and tables to find login passwords and session tokens.",
      log: "[CREDENTIALS] Stole administrative credentials and login keys from memory. EDR status: EVADED",
      status: "evaded",
      severity: "medium",
    },
    {
      title: "Moved to Another System",
      description: "Attacker moved from the first compromised computer to a server deeper in the network.",
      log: "[LATERAL] Moved to server node segment containing Swift-Transfer-Core. EDR status: BLOCKED",
      status: "blocked",
      severity: "high",
    },
    {
      title: "Gained Admin Access",
      description: "Attacker elevated their access level to become a network administrator.",
      log: "[ESCALATION] Root credentials retrieved. Gained administrator rights. EDR status: EVADED",
      status: "evaded",
      severity: "high",
    },
    {
      title: "Data Was Stolen and Locked",
      description: "Attacker copied sensitive files out of the network and started encrypting systems.",
      log: "[EXFILTRATION] Copied customer database tables and encrypted database files. EDR status: EVADED",
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

// Local Fallback CTI Report Generator
const generateCTIReport = (campaign: StoredCampaign) => {
  const actor = getActorName(campaign.threatActor);
  const vector = getAttackName(campaign.attackType);
  const industry = getIndustryName(campaign.industry);
  const target = campaign.primaryTarget;
  const isBlocked = campaign.status === "Blocked";

  // Executive Summary
  let execSummary = "";
  if (isBlocked) {
    execSummary = `A simulated attack emulating ${actor} was run against the ${industry} network target ${target}. The attacker attempted access via ${vector}. Under your current security strength (${campaign.securityLevel}), the platform's security rules successfully detected and stopped the attack. Defensive controls blocked the attacker from spreading through the network or copying files. Your target database remains safe, and defenses functioned as expected.`;
  } else {
    execSummary = `A security compromise was simulated representing a ${actor} attack against the ${industry} network. Using a ${vector} scenario, the attacker bypassed outer defenses, established a connection to the compromised device, and harvested active login credentials. The attacker then moved laterally across the network to access the target system ${target}, copying sensitive database tables and encrypting files. Local security rules failed to block these actions, highlighting a need for stronger security settings.`;
  }

  // Threat Actor Profile
  let actorProfile = "";
  if (campaign.threatActor === "APT29") {
    actorProfile = "APT29 (also known as CozyBear) is a state-sponsored advanced persistent threat group known for stealthy, long-term intelligence operations. They typically target government entities, foreign ministries, and critical research infrastructure. Their operational profile focuses heavily on defense evasion, utilizing spearphishing campaigns carrying weaponized attachments, API token hijacking, and custom backdoor loaders. APT29 prioritizes credential theft and lateral pivoting to establish persistent footholds while keeping log signatures minimal.";
  } else if (campaign.threatActor === "Lazarus") {
    actorProfile = "Lazarus Group is a state-sponsored cyber warfare actor famous for highly destructive attacks, financial cyber-heists, and cryptocurrency network infiltrations. Lazarus employs diverse, aggressive tactics, ranging from Blind SQL Injection on database services to weaponized supply chain dependencies. Their campaigns are characterized by rapid propagation, custom network evasion tunnels, and the deployment of wiper malware. Lazarus exhibits high operational flexibility and will pivot quickly to exfiltration or system ransom.";
  } else if (campaign.threatActor === "LockBit") {
    actorProfile = "LockBit 3.0 is one of the most prolific Ransomware-as-a-Service (RaaS) syndicate globally. Operating on a double-extortion model, they exfiltrate sensitive corporate databases before triggering local file encryption. LockBit targets commercial entities, municipal backbones, and healthcare infrastructures. They utilize automated network scanners, lateral service transfers, and memory dump scripts to steal administrative domain controller tokens. LockBit leverages aggressive double-extortion leak sites as leverage for payout.";
  } else if (campaign.threatActor === "FIN7") {
    actorProfile = "FIN7 is a highly organized, financially motivated cybercriminal syndicate specializing in targeting point-of-sale (POS) environments, corporate billing pipelines, and financial ledger services. FIN7 relies heavily on spearphishing campaigns with highly polished social engineering scripts. They deploy modular malware backdoors and memory scrapers to capture domain keys. FIN7 typically monitors compromised networks for weeks to map financial systems before executing final asset theft.";
  } else {
    actorProfile = "Anonymous is a decentralized, global hacktivist collective specializing in public-facing service disruptions, volumetric packet floods, and public data leaks. Their operational focus is ideological rather than financial, targeting public corporate portals and Registrar student backends. They utilize open-source stressor tools to execute volumetric DDoS packet floods and exploit SQL flaws on vulnerable web applications to leak customer lists. Anonymous actions are designed to cause maximum reputational damage.";
  }

  // Business Impact Assessment
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

  // Recommended Defenses
  const mitigations = [];
  if (campaign.attackType === "Phishing") {
    mitigations.push("Enforce hardware multi-factor authentication (MFA) like security keys to stop attackers from using stolen credentials.");
    mitigations.push("Use email filtering rules to detect and block malicious phishing links before they reach users.");
    mitigations.push("Enable endpoint protection rules to block credential harvesting tools from scanning system memory.");
  } else if (campaign.attackType === "Ransomware") {
    mitigations.push("Set up offline, immutable backups so data can be restored easily without paying a ransom.");
    mitigations.push("Disable default administrative folders (like Admin$ and C$) on endpoints to block spreading.");
    mitigations.push("Deploy active endpoint rules to detect and stop rapid file encryption attempts.");
  } else if (campaign.attackType === "DDoS") {
    mitigations.push("Use traffic scrubbing and web gateways to filter out large surges of malicious traffic.");
    mitigations.push("Configure rate limits on border firewalls to throttle excessive connection requests.");
    mitigations.push("Enable content delivery networks (CDNs) and caching to protect application servers under load.");
  } else if (campaign.attackType === "Supply Chain") {
    mitigations.push("Validate package integrity (using SHA-256 checks) before importing third-party libraries.");
    mitigations.push("Use software scan tools to identify known security vulnerabilities in external code dependencies.");
    mitigations.push("Configure firewall rules to block build servers from initiating unauthorized outbound connections.");
  } else { // SQL Injection
    mitigations.push("Use parameterized queries (prepared statements) in code to ensure input parameters cannot run database commands.");
    mitigations.push("Deploy a Web Application Firewall (WAF) to intercept database injection entries.");
    mitigations.push("Apply the principle of least privilege by removing write and file access permissions for the database user account.");
  }

  // Risk Reduction metrics
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
    mitreMapping: undefined as { stageIndex: number; code: string; name: string }[] | undefined // local has no overrides
  };
};

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toUTCString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  return <span className="text-cyber-cyan">{time || "00:00:00 UTC"}</span>;
}

const getEstimatedLearningOutcome = (attackType: string) => {
  switch (attackType) {
    case "Phishing":
      return "This simulation demonstrates how phishing attacks can bypass human trust and why layered defenses are important.";
    case "Ransomware":
      return "This simulation demonstrates how ransomware can lock critical data assets and why automated endpoint containment is vital.";
    case "DDoS":
      return "This simulation demonstrates how volumetric request traffic can disrupt public services and why gateway scrubbing rate limits are necessary.";
    case "SQL Injection":
      return "This simulation demonstrates how unsanitized database queries can expose table schemas and why parameterized parameters protect databases.";
    case "Supply Chain":
      return "This simulation demonstrates how trust in third-party software updates can be exploited and why package sign checking is essential.";
    default:
      return "This simulation demonstrates the stages of cyber intrusions and how proactive security controls prevent system compromises.";
  }
};

const getWhatYouLearnedSummary = (attackType: string) => {
  switch (attackType) {
    case "Phishing":
      return "This attack relied on social engineering rather than exploiting software vulnerabilities. The attacker first targeted people instead of systems. Once credentials were stolen, they attempted to move deeper into the environment. Stronger authentication controls would have significantly reduced the chance of success.";
    case "Ransomware":
      return "This attack demonstrated how malicious software can lock files and compromise databases. Rather than just stealing credentials, the attacker aimed to encrypt files to demand payment. Backups and write locks on volumes are critical for recovering without paying the attacker.";
    case "DDoS":
      return "This attack used brute-force network traffic to overwhelm server capacity, causing a denial of service. The attacker didn't need to bypass authentication to succeed; they simply flooded the doorway. Volumetric scrubbers and CDNs are needed to absorb these traffic surges.";
    case "SQL Injection":
      return "This attack exploited a database vulnerability on a public application. By manipulating input fields, the attacker executed commands directly on the database server. Parameterized queries are the most effective way to ensure inputs are treated as data, not code.";
    case "Supply Chain":
      return "This attack compromised a trusted software update process, inserting malicious code before the software was installed. Security systems trusted the signed package, allowing the attacker to bypass the perimeter. Automated checksum validation and registry controls block these malicious dependencies.";
    default:
      return "This simulation demonstrates how attackers identify weaknesses in defenses, move laterally within networks, and target critical databases. A defense-in-depth approach ensures that even if one layer fails, subsequent security controls block the intrusion.";
  }
};

const getPreventionSuite = (attackType: string) => {
  switch (attackType) {
    case "Phishing":
      return [
        { title: "Enable Multi-Factor Authentication", why: "Makes stolen passwords far less useful by requiring a second verification factor." },
        { title: "Use Endpoint Protection", why: "Detects suspicious activity, like credential harvesting tools, before damage occurs." },
        { title: "Employee Awareness Training", why: "Reduces the likelihood of users clicking malicious links or submitting passwords." }
      ];
    case "Ransomware":
      return [
        { title: "Configure Immutable Backups", why: "Ensures data cannot be deleted or encrypted by ransomware, enabling complete recovery." },
        { title: "Enforce Volume Write Locks", why: "Blocks unauthorized programs and script writers from modifying sensitive directories." },
        { title: "Enable Endpoint Detection & Response", why: "Instantly isolates infected machines to prevent ransomware from spreading." }
      ];
    case "DDoS":
      return [
        { title: "Deploy Traffic Scrubbing", why: "Volumetric packet scrubbers filter out malicious request spikes before they reach servers." },
        { title: "Configure SYN-Cookie Rate Limits", why: "Throttles connection counts at the gateway to keep load balancers operational." },
        { title: "Enable Edge Content Caching", why: "Distributes static content over CDNs to absorb loads and protect backend systems." }
      ];
    case "SQL Injection":
      return [
        { title: "Enforce Parameterized Queries", why: "Ensures database engines treat user input as values rather than executable commands." },
        { title: "Deploy Web Application Firewalls (WAF)", why: "Detects and blocks known database command injection patterns at the app boundary." },
        { title: "Apply Least Privilege Permissions", why: "Restricts database application accounts from reading or modifying database schemas." }
      ];
    case "Supply Chain":
      return [
        { title: "Validate Checksum Signatures", why: "Verifies the cryptographic hash of dependencies before they are built or executed." },
        { title: "Use Ephemeral Sandbox Builders", why: "Compiles code inside isolated, internet-restricted build agents." },
        { title: "Mirror Local Package Registries", why: "Forces dependencies to resolve from internal mirrors rather than public code hubs." }
      ];
    default:
      return [
        { title: "Zero Trust Architecture", why: "Restricts access to systems dynamically based on device compliance and identity checks." },
        { title: "Enforce Network Microsegmentation", why: "Restricts communication between servers to block lateral movements." },
        { title: "Implement Centralized Log Monitoring", why: "Helps security teams identify anomalous logs early and trigger responses." }
      ];
  }
};

const getIocData = (attackType: string) => {
  switch (attackType) {
    case "Phishing":
      return {
        ips: ["193.228.14.92", "45.227.254.101"],
        hashes: ["a8f278d9101d2ce9eb4b3e8e89f8101a", "2f913d80a10c92f1b0aef1010dbdeca3"],
        artifacts: ["C:\\Users\\Public\\Update.js", "http://login-verify-update.com/signin"],
      };
    case "Ransomware":
      return {
        ips: ["185.112.144.12", "91.240.118.83"],
        hashes: ["d3f1a0f8b19a1a0f8c8d8e8f8101a0f2", "f3a0d1e1f1c2d3e4f5a6b7c8d9e0f1a2"],
        artifacts: ["C:\\ProgramData\\lockbit.exe", "shadowcopy_delete.bat"],
      };
    case "DDoS":
      return {
        ips: ["103.88.22.41", "172.96.12.190"],
        hashes: ["n/a (traffic volumetric flood)"],
        artifacts: ["SYN flood on TCP Port 443", "DNS Query flood on Port 53"],
      };
    case "SQL Injection":
      return {
        ips: ["198.51.100.12", "203.0.113.88"],
        hashes: ["c8f2b3e4a9f81a7b3c2d1e0f9a8b7c6d"],
        artifacts: ["SELECT * FROM users WHERE id = '1' OR '1'='1';", "C:\\inetpub\\wwwroot\\uploads\\webshell.aspx"],
      };
    case "Supply Chain":
      return {
        ips: ["185.220.101.4", "45.154.253.22"],
        hashes: ["8f81a0b1c2d3e4f5a6b7c8d9e0f1a2b3", "7e70a9b8c7d6e5f4a3b2c1d0e9f8a7b6"],
        artifacts: ["package.json -> corrupted update v1.4.2", "npm install run-script outbound trigger"],
      };
    default:
      return {
        ips: ["192.0.2.1", "198.51.100.5"],
        hashes: ["9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c"],
        artifacts: ["Command line payload", "Outbound beacon connection"],
      };
  }
};

const getStorySteps = (attackType: string, status: "Blocked" | "Successful", stages: CampaignStage[]) => {
  const steps = [
    {
      title: "Looking for Weak Points (Reconnaissance)",
      doing: "Scanning network boundaries to identify active computers and open ports.",
      why: "To locate open doors and map the network layout before launching an exploit.",
      response: stages[0]?.status === "blocked"
        ? "The firewall immediately detected the scan patterns, flagged the IP, and blocked all further requests."
        : "The perimeter checks failed to flag the scan, allowing the attacker to map the target network segment successfully."
    },
    {
      title: "Trying to Get In (Initial Access)",
      doing: `Attempting to gain entry using the attack method (${attackType}).`,
      why: "To establish an active connection inside the network and bypass outer perimeter controls.",
      response: stages[1]?.status === "blocked"
        ? "The security gateway intercepted the malicious traffic or email link, blocking execution and terminating the connection."
        : "The security filters failed to block the payload, allowing the attacker to establish a silent connection inside the system."
    },
    {
      title: "Trying to Steal Passwords (Credential Access)",
      doing: "Searching system memory (e.g. LSASS dumps) for active login passwords and session keys.",
      why: "To steal administrator credentials, making it easy to masquerade as a legitimate user.",
      response: stages[2]?.status === "blocked"
        ? "Local endpoint protection detected the memory dumping attempt and immediately terminated the hostile process."
        : "Local protections failed, and the attacker successfully dumped system memory to harvest plain-text admin passwords."
    },
    {
      title: "Moving Through the Network (Lateral Movement)",
      doing: "Connecting from the first compromised computer to other critical servers deep in the network.",
      why: "To locate and access key database storage arrays containing sensitive data.",
      response: stages[3]?.status === "blocked"
        ? "Internal network firewalls blocked the unauthorized server-to-server traffic, isolating the threat."
        : "Unsegmented network paths allowed the attacker to pivot directly from the workstation to the database gateway."
    },
    {
      title: "Taking Control (Privilege Escalation)",
      doing: "Manipulating active security tokens to elevate permissions from a standard user to a system administrator.",
      why: "To gain unrestricted access and bypass database write locks and security rules.",
      response: stages[4]?.status === "blocked"
        ? "Access controllers flagged the token manipulation attempt and revoked the account's credentials."
        : "Loose configuration settings allowed the attacker to hijack admin tokens, granting them master control."
    },
    {
      title: "Attempting to Steal Data (Data Exfiltration)",
      doing: "Accessing target database directories to copy files and deploy disruptive payloads.",
      why: "To exfiltrate sensitive files out of the network and encrypt databases to demand ransom payment.",
      response: stages[5]?.status === "blocked"
        ? "Automated database triggers and write locks immediately isolated the target files, preventing all exfiltration."
        : "Defenses failed to halt database operations, allowing the attacker to copy sensitive customer files and encrypt the system."
    }
  ];

  return steps;
};

const getAttackJourneyFlow = (attackType: string) => {
  const journeys: Record<string, string[]> = {
    Phishing: [
      "Fake Email Delivered",
      "Victim Clicked Link",
      "Password Stolen",
      "Attacker Entered System",
      "Sensitive Records Accessed"
    ],
    Ransomware: [
      "Malicious File Downloaded",
      "Victim Opened Attachment",
      "Ransomware Run on Machine",
      "Files Locked and Encrypted",
      "Payment Demand Displayed"
    ],
    DDoS: [
      "Malicious Traffic Flooded Gateway",
      "Gateway Ports Overloaded",
      "Server Resource Limits Exhausted",
      "Public Web Portal Crashed",
      "Services Unreachable for Users"
    ],
    "SQL Injection": [
      "Malicious Input Sent to Web Form",
      "Database Command Query Executed",
      "Access Authentication Bypassed",
      "Attacker Gained Database Entry",
      "Sensitive Customer Lists Stolen"
    ],
    "Supply Chain": [
      "Malicious Package Pushed to Public Library",
      "Developer Build System Imported Package",
      "Malicious Code Run During Software Build",
      "Hidden Back Door Opened on Build Server",
      "Attacker Accessed Internal Infrastructure"
    ]
  };

  return journeys[attackType] || [
    "Attack Initiated",
    "Outer Defenses Probed",
    "System Vulnerability Exploited",
    "Internal Pivot Attempted",
    "Data Assets Target Reached"
  ];
};

const getImpactDetails = (attackType: string, industry: string, isBlocked: boolean) => {
  const defaultSystems = ["Internal workstations", "Directory servers", "Backup servers"];
  const defaultConsequences = ["Operational delays", "Exposure of internal files", "Service downtime"];
  const defaultRecovery = isBlocked 
    ? "Under 1 hour to inspect logs, run scans, and confirm containment."
    : "Several hours to multiple days depending on backups and incident response readiness.";
  const defaultImprovements = ["Multi-factor authentication", "Email filtering", "Network separation", "Endpoint protection"];

  const mapping: Record<string, Record<string, { systems: string[]; consequences: string[]; recovery: string; improvements: string[] }>> = {
    Banking: {
      Phishing: {
        systems: ["Employee email accounts", "SWIFT transfer terminals", "Identity directories"],
        consequences: ["Unauthorized fund transfers", "Exposed customer banking records", "Temporary compliance halts"],
        recovery: isBlocked 
          ? "Under 1 hour to lock the targeted email accounts and reset credentials." 
          : "24 to 72 hours to audit transaction logs and verify SWIFT network compliance.",
        improvements: ["Hardware-based MFA security keys", "Email DMARC/SPF ingress rules", "Endpoint memory scanning blocks"]
      },
      Ransomware: {
        systems: ["Transaction ledgers", "Core account databases", "Backup storage drives"],
        consequences: ["Interrupted customer transactions", "Locked branch operations", "Regulatory non-compliance fines"],
        recovery: isBlocked 
          ? "Under 2 hours to confirm malware containment and run full network scans." 
          : "3 to 5 days to restore banking nodes from secure offline backup snapshots.",
        improvements: ["Immutable cloud backups", "Endpoint containment playbooks", "Workstation volume write blocks"]
      },
      DDoS: {
        systems: ["Online banking web portals", "Mobile application API servers", "Internet gateway router ports"],
        consequences: ["Customers unable to log in", "Interrupted online transfers", "Customer support desk overload"],
        recovery: isBlocked 
          ? "Under 30 minutes for traffic scrubbers to absorb and filter the surge." 
          : "6 to 12 hours of service degradation while filtering attacker IP networks.",
        improvements: ["Volumetric DDoS traffic scrubbers", "SYN-cookie rate limits", "Distributed CDN caching"]
      },
      "SQL Injection": {
        systems: ["Customer accounting schemas", "Loan approval databases", "Public contact forms"],
        consequences: ["Theft of client account credentials", "Exposed balance databases", "Application code exploitation"],
        recovery: isBlocked 
          ? "Under 1 hour to patch public query fields and verify database security logs." 
          : "12 to 36 hours to review database leaks, patch SQL code, and rotate passwords.",
        improvements: ["Parameterized database queries", "Web Application Firewalls (WAF)", "Least privilege database accounts"]
      },
      "Supply Chain": {
        systems: ["Core banking software build servers", "Internal software dependency libraries", "Developer computers"],
        consequences: ["Infected banking software updates", "Undetected system backdoor access", "Compromised developer credentials"],
        recovery: isBlocked 
          ? "Under 2 hours to isolate build containers and inspect dependency files." 
          : "Several days to weeks to audit software code packages and rebuild environments.",
        improvements: ["Cryptographic dependency checksums", "Isolated CI/CD builders", "Mirrored local package repositories"]
      }
    },
    Healthcare: {
      Phishing: {
        systems: ["Staff email systems", "Patient scheduling records", "Employee directories"],
        consequences: ["Interrupted doctor schedules", "Exposed patient contact details", "Stolen staff credentials"],
        recovery: isBlocked 
          ? "Under 1 hour to lock the compromised inbox and alert staff." 
          : "24 to 48 hours to inspect logs and ensure no other medical files were opened.",
        improvements: ["Multi-factor authentication (MFA)", "Phishing email filtering rules", "Endpoint credential dumping alerts"]
      },
      Ransomware: {
        systems: ["Electronic Medical Records (EMR)", "Hospital scheduling databases", "Emergency dispatch nodes"],
        consequences: ["Unable to access patient history", "Canceled surgeries and appointments", "Forced manual triage protocols"],
        recovery: isBlocked 
          ? "Under 2 hours to verify isolated hosts and restore normal logins." 
          : "2 to 4 days to rebuild EMR servers and recover files from offline backup drives.",
        improvements: ["Immutable backups", "Network microsegmentation", "Automated threat containment"]
      },
      DDoS: {
        systems: ["Patient telemedicine portals", "Hospital website host servers", "Inbound internet gateways"],
        consequences: ["Canceled online doctor visits", "Patients unable to reach online help", "Internal system connectivity delays"],
        recovery: isBlocked 
          ? "Under 30 minutes to apply border rate limiting and route scrubbers." 
          : "6 to 18 hours of intermittent telemedicine access while scrubbing traffic.",
        improvements: ["Distributed CDN edge caching", "Border firewall rate limits", "Backup internet gateway routing"]
      },
      "SQL Injection": {
        systems: ["Patient diagnosis databases", "Billing records tables", "Public appointment forms"],
        consequences: ["Exposed patient treatment history", "Stolen billing information", "Unsanitized database queries run"],
        recovery: isBlocked 
          ? "Under 1 hour to patch inputs and verify patient record integrity." 
          : "12 to 24 hours to patch application code, verify leaks, and alert compliance.",
        improvements: ["Parameterized query bind parameters", "Web Application Firewalls", "Database least privilege rights"]
      },
      "Supply Chain": {
        systems: ["Medical software build pipelines", "Internal libraries", "Medical imaging update systems"],
        consequences: ["Malicious software run on hospital networks", "Backdoors in medical updates", "Exposed system servers"],
        recovery: isBlocked 
          ? "Under 2 hours to isolate servers and inspect software dependency logs." 
          : "Several days to audit all medical app packages and reinstall systems.",
        improvements: ["Package verification controls", "Sandboxed build runners", "Mirrored internal library registries"]
      }
    }
  };

  const industryMap = mapping[industry] || mapping["Healthcare"];
  return industryMap[attackType] || {
    systems: defaultSystems,
    consequences: defaultConsequences,
    recovery: defaultRecovery,
    improvements: defaultImprovements
  };
};

const getEducationalLessons = (attackType: string, securityLevel: string) => {
  const isLowOrMedium = securityLevel === "Low" || securityLevel === "Medium";
  
  const defaultLessons = {
    keyTakeaway: "Cybersecurity is about defense in depth. One single lock is not enough to stop a determined attacker.",
    whatBeginnersRemember: "Always double-check link origins, use strong password managers, and enable multi-factor authentication (MFA).",
    realWorldLesson: "Many real-world breaches happen because of minor security configuration gaps that go unpatched for months.",
    whyAttackWorked: "The security setup did not have layered boundary protections, allowing the attacker to pivot from system to system.",
    howDefendersImprove: "Segment networks into isolated security zones, monitor system memory, and configure automatic alerts for credential theft attempts."
  };

  const lessons: Record<string, typeof defaultLessons> = {
    Phishing: {
      keyTakeaway: "Attackers often target humans first because people can be tricked easier than computers. Securing credentials is our strongest defense.",
      whatBeginnersRemember: "Phishing emails look identical to real ones. Never type your login password after clicking a link in an email; always log in directly through the main website.",
      realWorldLesson: "Even major technology organizations get breached because a single employee was tricked by a fake login form.",
      whyAttackWorked: isLowOrMedium 
        ? "The security setup lacked Multi-Factor Authentication (MFA) and did not scan email attachments, allowing the attacker to harvest active logins easily."
        : "Although basic email filters were active, the user was able to bypass warn prompts and enter credentials on a spoofed external portal.",
      howDefendersImprove: "Enforce hardware-based security keys (MFA) that cannot be phished, run automated email link scanners, and train employees."
    },
    Ransomware: {
      keyTakeaway: "Ransomware attempts to cause maximum disruption by locking data assets. Protecting backups is the key to recovery.",
      whatBeginnersRemember: "Opening one suspicious file attachment can compromise an entire business network within minutes.",
      realWorldLesson: "Organizations have paid millions of dollars to recover files because their online backups were encrypted by the attacker too.",
      whyAttackWorked: isLowOrMedium
        ? "Operating system folders allowed write permissions for standard user scripts, and backup drives were connected directly to the network."
        : "Defenses detected the ransomware payload but lacked automatic endpoint isolation, allowing the encryption tool to spread to server nodes.",
      howDefendersImprove: "Set up immutable (non-rewritable) offline backups, restrict volume write access, and deploy endpoint tools to isolate hosts instantly."
    },
    DDoS: {
      keyTakeaway: "DDoS attacks do not try to steal passwords or breach data; they simply flood the entry gates to keep real users out.",
      whatBeginnersRemember: "If a website is running slow or not responding, it might be undergoing a traffic flood rather than being breached.",
      realWorldLesson: "Volumetric floods are often used as a decoy to distract security teams while attackers breach systems silently elsewhere.",
      whyAttackWorked: isLowOrMedium
        ? "The load balancer did not limit connection rates, and there were no traffic scrubbers to inspect and filter packet loads."
        : "The volume of traffic was too massive for the local gateway servers to absorb, leading to memory and port exhaustion.",
      howDefendersImprove: "Use third-party traffic scrubbing networks, set rate limits on connections, and cache pages at the network edge."
    },
    "SQL Injection": {
      keyTakeaway: "SQL Injection occurs when a database treats user input as executable instructions. Input must always be cleaned and separated.",
      whatBeginnersRemember: "Web forms (like username inputs) should only accept text characters, never code statements or database operators.",
      realWorldLesson: "SQL Injection is one of the oldest web vulnerabilities but remains common because developer code often concatenates database query strings.",
      whyAttackWorked: isLowOrMedium
        ? "The web application query strings directly concatenated input fields, allowing standard user inputs to bypass authentication checks."
        : "Although a basic firewall was active, the database was accessed using a master admin account with full write permissions.",
      howDefendersImprove: "Enforce parameterized database queries (prepared statements), deploy Web Application Firewalls (WAF), and limit database user account access."
    },
    "Supply Chain": {
      keyTakeaway: "Supply chain attacks exploit trust. When we import packages, we import all of their hidden security gaps too.",
      whatBeginnersRemember: "Always verify the creator and code checksum of packages before installing them in your programming project.",
      realWorldLesson: "Attackers compromise open-source package repositories to inject backdoors into trusted software updates used by millions.",
      whyAttackWorked: isLowOrMedium
        ? "The system automatically downloaded dependency packages from public registries without verifying signature checksums."
        : "The builder network was connected to the public internet, allowing the corrupted code package to make outbound connections.",
      howDefendersImprove: "Validate package checksum hashes, run software build pipelines in internet-isolated sandboxes, and audit code dependencies."
    }
  };

  return lessons[attackType] || defaultLessons;
};

interface CTIReport {
  id: string;
  timestamp: string;
  actorName: string;
  actorId: string;
  vectorName: string;
  vectorId: string;
  industryName: string;
  targetName: string;
  status: "Blocked" | "Successful";
  securityLevel: string;
  executiveSummary: string;
  actorProfile: string;
  financialLoss: string;
  operationalImpact: string;
  downtime: string;
  mitigations: string[];
  currentRisk: number;
  projectedRisk: number;
  riskReduction: number;
  stages: CampaignStage[];
  mitreMapping?: { stageIndex: number; code: string; name: string }[];
}

const getCaseStudyTitle = (vectorId: string, status: string) => {
  const isBlocked = status === "Blocked";
  switch (vectorId) {
    case "Phishing":
      return isBlocked 
        ? "How Active Filtering Intercepted a Targeted Phishing Attack"
        : "How a Fake Email Led to Unauthorized Access";
    case "Ransomware":
      return isBlocked
        ? "How Automated Isolation Defeated an Encryption Threat"
        : "How Weak Security Controls Allowed an Internal Breach";
    case "SQL Injection":
      return isBlocked
        ? "How Parameter Validation Protected Database Assets"
        : "How Stolen Credentials Exposed Sensitive Records";
    case "DDoS":
      return isBlocked
        ? "How Rate Limits Intercepted a Volumetric Service Flood"
        : "How Traffic Overload Disrupted Public Service Portals";
    case "Supply Chain":
      return isBlocked
        ? "How Signature Checks Intercepted a Supply Chain Intrusion"
        : "How a Malicious Package Update Gained Silent Control";
    default:
      return isBlocked
        ? "How Multi-Layered Postures Contained a Simulated Intrusion"
        : "How Weak Defensive Controls Allowed a System Compromise";
  }
};

const getScenarioSummary = (vectorId: string, status: string, industry: string, target: string) => {
  const isBlocked = status === "Blocked";
  if (vectorId === "Phishing") {
    return isBlocked
      ? `A simulated email scam was delivered to a user workstation in our ${industry} environment to establish initial access. While the link was clicked, the attacker's attempt to steal login credentials and pivot laterally was intercepted. Our active security posture flagged the unauthorized access request and blocked database volume modifications on ${target}. The attack was successfully contained before any sensitive information could be copied.`
      : `During this simulation, an attacker targeted our ${industry} environment using a deceptive email scam. The email bypassed boundary checks, causing an employee to click a malicious link and unknowingly reveal their login credentials. Armed with active administrator access, the attacker moved deep into internal networks to target ${target}. Because multi-factor authentication was not enforced, the attacker successfully accessed database target directories and compromised sensitive records.`;
  }
  if (vectorId === "Ransomware") {
    return isBlocked
      ? `An attacker attempted to deploy encryption malware to compromise target arrays on ${target} in our ${industry} environment. While the initial script executed on an endpoint workstation, it was quickly flagged by system sensors. The attempt to elevate local permissions and pivot laterally was blocked by automated endpoint containment rules. As a result, critical database arrays remained fully secured and operational.`
      : `The simulation demonstrated a file encryption attack aimed at locking target systems on ${target} in the ${industry} environment. The attacker successfully gained access to a user endpoint and executed a payload that searched memory for credentials. Lacking internal network separation, the attacker moved laterally to intermediate servers and elevated user privileges to Administrator. The attack succeeded in locking backup directories and encrypting sensitive target tables.`;
  }
  if (vectorId === "DDoS") {
    return isBlocked
      ? `A volumetric traffic overload was directed at network access ports in the ${industry} environment to disrupt operations on ${target}. Gateway scrubbing rules and rate limits identified the flooding pattern from the hostile IP source. The traffic was filtered and blocked at the border, allowing system services to remain fully responsive for users without any downtime.`
      : `A volumetric traffic overload attack was launched to overwhelm service access points on ${target} in our ${industry} environment. Lacking scrubbing gates, the simulated flood quickly saturated public-facing interfaces. System services became completely unresponsive, preventing legitimate connections and causing severe operational halts. The simulation ended with services failing under the massive traffic load.`;
  }
  if (vectorId === "SQL Injection") {
    return isBlocked
      ? `An attacker attempted to extract private database tables from ${target} in the ${industry} environment using input field injection. Although malicious queries were sent to the database interface, parameterized inputs and query filters neutralized the command syntax. The attempt was flagged as hostile and blocked at the application layer, preventing any data exposure.`
      : `The attacker targeted the web application database on ${target} in our ${industry} environment using unsanitized SQL commands. An exposed input field allowed the attacker to bypass access filters and read database structures. Moving through database schemas, the attacker extracted password hashes and stole administrative tables, culminating in unauthorized reading of customer database targets.`;
  }
  if (vectorId === "Supply Chain") {
    return isBlocked
      ? `An attacker attempted to compromise software dependencies on ${target} in our ${industry} environment by injecting a malicious library update. During download, the system's software signature checker noticed the invalid verification key and blocked installation. The backdoor attempt was terminated immediately, keeping internal networks secured.`
      : `A malicious package update was injected into software libraries on ${target} in our ${industry} environment to bypass perimeter checks. The update was downloaded by internal deployment routines, establishing a backdoor. Lacking file checking rules, the update ran and allowed the attacker to elevate local privileges and access target datastores, gaining complete administrative system control.`;
  }
  return isBlocked
    ? `Our active defensive posture successfully contained a simulated intrusion in the ${industry} environment targeting ${target}. The threat was detected early in the attack lifecycle and terminated before any critical assets could be accessed or stolen.`
    : `A simulated security breach in the ${industry} environment exposed system configurations on ${target}. Because defensive rules were unconfigured or bypassed, the attacker moved successfully through the network and completed their objectives.`;
};

const getPrintTimeline = (vectorId: string, stages: CampaignStage[]) => {
  const list = [];
  for (let idx = 0; idx < stages.length; idx++) {
    const stage = stages[idx];
    const isStageBlocked = stage.status === "blocked";
    const isPriorStageBlocked = stages.slice(0, idx).some(s => s.status === "blocked");
    
    let title = stage.title;
    let whatHappened = "";
    let whyItMatters = "";
    let outcome = "";

    if (isPriorStageBlocked) {
      whatHappened = "This stage was not reached.";
      whyItMatters = "The attack was already stopped in a previous step, preventing further progression.";
      outcome = "Unreached due to containment.";
      list.push({ title, whatHappened, whyItMatters, outcome });
      continue;
    }

    if (idx === 0) {
      title = "Scanning for Weak Points";
      whatHappened = "The attacker scanned public connections to identify active interfaces and open ports.";
      whyItMatters = "Open ports let attackers locate potential doors into the private network.";
      outcome = isStageBlocked 
        ? "The firewall detected the scanning pattern and blocked further requests from the attacker's IP." 
        : "The attacker mapped the network's interfaces successfully.";
    } else if (idx === 1) {
      title = "Getting Into The System";
      if (vectorId === "Phishing") {
        whatHappened = "An employee received a deceptive email containing a malicious link.";
        whyItMatters = "Deceptive emails are the most common entry vector to bypass network firewalls.";
        outcome = isStageBlocked 
          ? "Email security filters recognized the malicious link and quarantined the message." 
          : "The employee clicked the link and opened the connection.";
      } else if (vectorId === "Ransomware") {
        whatHappened = "A malicious file download was triggered from a compromised website.";
        whyItMatters = "Malware downloads run initial access scripts to establish a local foothold.";
        outcome = isStageBlocked 
          ? "The endpoint protection blocked the file from executing." 
          : "The script executed, establishing a local network backdoor.";
      } else if (vectorId === "DDoS") {
        whatHappened = "The attacker initiated a flood of request packets towards the main gateway.";
        whyItMatters = "Traffic floods seek to saturate system resources and prevent real connections.";
        outcome = isStageBlocked 
          ? "The border router dropped the scanning packets and throttled the IP block." 
          : "Hostile requests saturated the load balancer port allocations.";
      } else if (vectorId === "SQL Injection") {
        whatHappened = "The attacker sent database query syntax through an unvalidated web form input field.";
        whyItMatters = "Exposed input fields let malicious commands execute directly on database engines.";
        outcome = isStageBlocked 
          ? "The application filtered out special query operators, blocking command parsing." 
          : "The application compiled the input string directly as a database request.";
      } else { // Supply Chain
        whatHappened = "The builder platform initiated a regular package fetch from public registries.";
        whyItMatters = "Default trust settings allow software update managers to download unverified dependencies.";
        outcome = isStageBlocked 
          ? "The dependency loader rejected the package update due to an invalid cryptographic signature." 
          : "The unverified dependency package was successfully compiled into the application environment.";
      }
    } else if (idx === 2) {
      title = "Trying To Steal Passwords";
      whatHappened = "The attacker dumped system memory to search for active logins and session keys.";
      whyItMatters = "Stolen logins allow the attacker to impersonate legitimate administrators.";
      outcome = isStageBlocked 
        ? "Local protection tools intercepted memory access, blocking credential extraction." 
        : "Administrative passwords and session hashes were extracted.";
    } else if (idx === 3) {
      title = "Moving Through The Network";
      whatHappened = "The attacker used stolen credentials to connect to databases and internal servers.";
      whyItMatters = "Critical databases are kept deep in the network, requiring pivoting from endpoints.";
      outcome = isStageBlocked 
        ? "Internal firewalls blocked server access requests from standard workstations." 
        : "The attacker connected directly to the database server host.";
    } else if (idx === 4) {
      title = "Taking Control";
      whatHappened = "The attacker ran local scripts to elevate permissions to system administrator.";
      whyItMatters = "Administrator control lets the attacker disable security logs and override access rules.";
      outcome = isStageBlocked 
        ? "Access control rules flagged the privilege escalation and locked the account." 
        : "The attacker took complete administrative control over the database system.";
    } else if (idx === 5) {
      title = "Stealing Data";
      if (vectorId === "Ransomware") {
        whatHappened = "The attacker deployed wiper malware to encrypt system database files.";
        whyItMatters = "Encrypted files prevent business operations, allowing attackers to demand payment.";
        outcome = isStageBlocked 
          ? "System backup arrays and database volumes were locked, preventing encryption." 
          : "Critical database directories were encrypted and locked.";
      } else if (vectorId === "DDoS") {
        whatHappened = "The service interface became fully saturated by persistent traffic.";
        whyItMatters = "Prolonged downtime halts all business operations and customer access.";
        outcome = isStageBlocked 
          ? "Traffic scrubbing limited the impact, keeping services online." 
          : "Core systems crashed, leading to total operational failure.";
      } else {
        whatHappened = "The attacker compiled database records and exfiltrated files to an external server.";
        whyItMatters = "Exfiltrated records expose customer private details and violate regulatory laws.";
        outcome = isStageBlocked 
          ? "Database monitors flagged the massive export request and locked all tables." 
          : "Customer records and private tables were copied out of the network.";
      }
    }
    list.push({ title, whatHappened, whyItMatters, outcome });
  }
  return list;
};

const getWhySecurityStruggled = (vectorId: string, status: string, securityLevel: string) => {
  const isBlocked = status === "Blocked";
  if (isBlocked) {
    return `Security succeeded during this simulation because multiple defensive layers were active. When the threat actor attempted to probe ports or run malicious payloads, the systems flagged the activity. By blocking IP ranges or preventing database writes early on, the active controls kept the intrusion contained. This shows that layered defenses can protect critical assets even when an attacker gains a temporary foothold.`;
  }
  if (vectorId === "Phishing") {
    return `Security struggled because the system relied entirely on standard passwords. Once the employee was tricked into entering their login credentials on the fake website, the attacker could log in without any secondary checks. Lacking network segmentation, the workstation could connect directly to the database. Additionally, a lack of active endpoint controls let the attacker search memory for administrative keys without triggering an alarm.`;
  }
  if (vectorId === "Ransomware") {
    return `Security struggled because the endpoint workstation lacked containment rules. This allowed the attacker's script to execute and download malware files. Because backup systems were kept online and connected to the same network segment, the encryption process easily reached the backup files. Additionally, a lack of local access controls allowed a standard workstation account to run administrator-level updates.`;
  }
  if (vectorId === "DDoS") {
    return `Security struggled because the public web servers had no rate-limiting or scrubbing policies configured. When the automated request flood started, the network interfaces were quickly overwhelmed by the volume. Without a gateway filter to distinguish malicious requests from normal user actions, all traffic was processed, causing the systems to exhaust their resources and crash.`;
  }
  if (vectorId === "SQL Injection") {
    return `Security struggled because the web application's form inputs accepted raw query commands without validation. This allowed the attacker to type database syntax directly into fields and read database tables. Additionally, the web service account had overly permissive rights, allowing it to query administrative schemas and extract password hashes.`;
  }
  return `Security struggled because the deployment system trusted external package updates by default. When the malicious update was pushed to the repository, it was installed automatically without any signature or checksum verification. Once installed, the update established a backdoor connection that was not flagged by outbound network monitors.`;
};

const getWhyThisMatters = (vectorId: string) => {
  if (vectorId === "Phishing") {
    return [
      "Customer account passwords, emails, and login hashes could be stolen.",
      "Operations would halt while administrators verify all active user sessions.",
      "The organization could face regulatory penalties and lose client trust.",
      "Recovery would involve resetting all user credentials and auditing logs."
    ];
  }
  if (vectorId === "Ransomware") {
    return [
      "Operational databases and files could be permanently locked or deleted.",
      "Daily services would stop entirely, halting business operations.",
      "Attackers could extort the company for financial ransom payments.",
      "Recovery would depend on restoring clean files from offline backup archives."
    ];
  }
  if (vectorId === "DDoS") {
    return [
      "Public portals and service interfaces would become completely offline.",
      "Customers would be unable to access their accounts or complete transactions.",
      "Support lines would be overwhelmed by user complaints during the outage.",
      "Recovery requires filtering traffic, blocks, and redirecting requests."
    ];
  }
  if (vectorId === "SQL Injection") {
    return [
      "Sensitive database tables, including private records, could be exposed.",
      "Attackers could modify database entries, corrupting system data.",
      "The business could face severe regulatory fines for data privacy failures.",
      "Recovery involves patching application code and auditing database query logs."
    ];
  }
  return [
    "Proprietary software updates could carry backdoors to compromise other systems.",
    "Internal code repositories and network credentials could be stolen.",
    "The organization could lose its certification and suffer severe loss of trust.",
    "Recovery requires revoking certificates, auditing code, and rebuilding updates."
  ];
};

const getPreventativeDefenses = (vectorId: string) => {
  if (vectorId === "Phishing") {
    return [
      { rank: "Most Important", icon: "🔐", name: "Multi-Factor Authentication", desc: "Even with a stolen password, attackers cannot access accounts without the secondary verification code." },
      { rank: "Moderately Important", icon: "✉", name: "Email Filtering", desc: "Identifies and blocks deceptive emails before they ever reach an employee's inbox." },
      { rank: "Additional Protection", icon: "🛡", name: "Endpoint Monitoring", desc: "Tracks local computer activity to detect and block malicious credential-theft tools in memory." }
    ];
  }
  if (vectorId === "Ransomware") {
    return [
      { rank: "Most Important", icon: "🔐", name: "Endpoint Isolation", desc: "Automated endpoint containment can immediately quarantine a workstation when encryption starts, preventing it from spreading." },
      { rank: "Moderately Important", icon: "✉", name: "Network Segmentation", desc: "Dividing the network into isolated zones restricts the attacker from moving from workstations to servers." },
      { rank: "Additional Protection", icon: "🛡", name: "Immutable Backups", desc: "Keeping database backup files in read-only offline folders protects recovery data from encryption." }
    ];
  }
  if (vectorId === "DDoS") {
    return [
      { rank: "Most Important", icon: "🔐", name: "Traffic Scrubbing", desc: "Route public traffic through gateway systems that analyze signatures and drop request floods before they reach servers." },
      { rank: "Moderately Important", icon: "✉", name: "Rate Limiting", desc: "Restricts the number of connections any single IP address can submit within a specific timeframe." },
      { rank: "Additional Protection", icon: "🛡", name: "Load Balancing", desc: "Distributes incoming traffic across redundant server nodes so that a flood targeting one node does not crash the system." }
    ];
  }
  if (vectorId === "SQL Injection") {
    return [
      { rank: "Most Important", icon: "🔐", name: "Parameterized Queries", desc: "Forces the database to treat inputs strictly as text rather than executable query commands." },
      { rank: "Moderately Important", icon: "✉", name: "Input Validation", desc: "Filters web form inputs to block query characters and SQL statements at the boundary." },
      { rank: "Additional Protection", icon: "🛡", name: "Least Privilege Access", desc: "Restricts database credentials so that the web application cannot run administrative updates or read schemas." }
    ];
  }
  return [
    { rank: "Most Important", icon: "🔐", name: "Signature Verification", desc: "Requires cryptographic signatures for package updates, blocking installation of unverified files." },
    { rank: "Moderately Important", icon: "✉", name: "Package Auditing", desc: "Scans code libraries for known security gaps and hidden backdoor modules before deployment." },
    { rank: "Additional Protection", icon: "🛡", name: "Network Outbound Rules", desc: "Blocks internal software update engines from establishing unauthorized external server connections." }
  ];
};

const getCaseStudyKeyLessons = (vectorId: string) => {
  if (vectorId === "Phishing") {
    return [
      "Passwords alone are no longer enough to protect accounts; secondary checks are critical.",
      "Security is a team effort that combines human alertness with automated rules.",
      "A single mistake can compromise a workstation and serve as a foothold for larger attacks."
    ];
  }
  if (vectorId === "Ransomware") {
    return [
      "Network segmentation prevents local workstation threats from spreading to database servers.",
      "Automated isolation can stop malware execution before file encryption begins.",
      "Offline backups are the only guarantee for file recovery after an encryption attack."
    ];
  }
  if (vectorId === "DDoS") {
    return [
      "Volumetric attacks target system availability rather than stealing private data.",
      "Rate-limiting rules are essential to separate normal user actions from traffic floods.",
      "Outages interrupt business operations and damage customer trust."
    ];
  }
  if (vectorId === "SQL Injection") {
    return [
      "Unsanitized user inputs are a direct gateway for database exposure.",
      "Parameterized queries are the most effective way to neutralize input manipulation threats.",
      "Database permissions should restrict access only to the tables a user actually needs."
    ];
  }
  return [
    "Supply chain attacks leverage trusted software channels to bypass boundary defenses.",
    "Cryptographic signatures are critical to verify the source of software updates.",
    "Zero-trust principles require verifying package signatures before execution."
  ];
};

const getFinalThoughtPrint = (vectorId: string, status: string) => {
  const isBlocked = status === "Blocked";
  if (isBlocked) {
    return "Remember that cybersecurity is not about building a single perfect wall, but about layering checks so that when one layer fails, another is ready to intercept the threat. By rate-limiting requests, segmenting servers, or filtering emails, we prevent small gaps from becoming system-wide breaches. Real security means ensuring that if one door is opened, the inner chambers remain fully locked.";
  }
  return "Remember that a single unpatched gap or human error is often all an attacker needs to bypass perimeter firewalls. When networks lack multi-factor authentication, segmentation, or query validation, attackers can easily pivot from a user workstation to the core database. Cybersecurity requires multi-layered safeguards at every stage to ensure a single mistake cannot compromise the entire system.";
};

const generateReportId = (timestamp: string, reportId: string) => {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hash = reportId ? reportId.substring(0, 4).toUpperCase() : Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SENT-${yyyy}${mm}${dd}-${hash}`;
};

const getPrimaryWeakness = (vectorId: string) => {
  switch (vectorId) {
    case "Phishing":
      return "Lack of Multi-Factor Authentication (MFA) and employee security awareness regarding spear-phishing links.";
    case "Ransomware":
      return "Flat network architecture enabling unchecked lateral movement and lack of automated endpoint containment.";
    case "DDoS":
      return "Lack of rate-limiting rules and public traffic scrubbing capability at the network boundary.";
    case "SQL Injection":
      return "Unsanitized user inputs in web forms allowing direct command execution on back-end database servers.";
    case "Supply Chain":
    default:
      return "Trusting software updates from third-party channels without verifying package signatures or outbound rules.";
  }
};

const getTopImprovement = (vectorId: string) => {
  switch (vectorId) {
    case "Phishing":
      return "Enforce hardware multi-factor authentication (MFA) and establish strict inbound mail filtering rules.";
    case "Ransomware":
      return "Implement strict network micro-segmentation and maintain offline/immutable backup copies.";
    case "DDoS":
      return "Deploy traffic-scrubbing services and rate-limiting at the API gateway layer.";
    case "SQL Injection":
      return "Use parameterized SQL queries and sanitize all incoming user database inputs.";
    case "Supply Chain":
    default:
      return "Implement cryptographic signature checks for all updates and restrict server outbound traffic.";
  }
};

const PrintCaseStudy = ({ reportData }: { reportData: CTIReport }) => {
  const title = getCaseStudyTitle(reportData.vectorId, reportData.status);
  const summary = getScenarioSummary(reportData.vectorId, reportData.status, reportData.industryName, reportData.targetName);
  const timeline = getPrintTimeline(reportData.vectorId, reportData.stages);
  const whySecurityStruggled = getWhySecurityStruggled(reportData.vectorId, reportData.status, reportData.securityLevel);
  const whyThisMatters = getWhyThisMatters(reportData.vectorId);
  const preventions = getPreventativeDefenses(reportData.vectorId);
  const lessons = getCaseStudyKeyLessons(reportData.vectorId);
  const reflection = getFinalThoughtPrint(reportData.vectorId, reportData.status);

  const reportId = generateReportId(reportData.timestamp, reportData.id);
  const isBlocked = reportData.status === "Blocked";

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case "critical":
        return <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">Critical</span>;
      case "high":
        return <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-250">High</span>;
      case "medium":
        return <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-yellow-50 text-yellow-800 border border-yellow-200">Medium</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">Low</span>;
    }
  };

  return (
    <div className="hidden print:block text-black bg-white font-sans text-sm max-w-[21cm] mx-auto">
      {/* CSS overrides to ensure clean background color and no header/footer default elements when printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          @page {
            size: A4;
            margin-top: 30px;
            margin-bottom: 24px;
            margin-left: 24px;
            margin-right: 24px;
          }
          .print-section {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 24px;
          }
          .page-num::after {
            content: counter(page);
          }
          .page-total::after {
            content: counter(pages);
          }
          table {
            border-collapse: collapse !important;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      ` }} />

      {/* =========================================================
          PAGE 1: COVER PAGE
          ========================================================= */}
      <div className="flex flex-col justify-between items-start text-left p-12 bg-white" style={{ pageBreakAfter: "always", minHeight: "27cm" }}>
        {/* Header Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-white font-mono font-extrabold text-sm">
            S
          </div>
          <span className="text-black font-extrabold tracking-[0.2em] font-mono text-sm uppercase">SENTINEL</span>
        </div>

        {/* Main Metadata Section */}
        <div className="w-full my-auto space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-widest uppercase text-slate-400 font-bold block">Cybersecurity Incident Report</span>
            <h1 className="text-3xl font-extrabold text-black font-sans leading-tight border-b-2 border-black pb-4 max-w-2xl">{title}</h1>
          </div>

          <div className="w-full max-w-xl space-y-3 font-sans text-xs pt-4">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-mono uppercase text-[9px] tracking-wider">Simulation Name</span>
              <span className="text-black font-bold text-right max-w-[320px] truncate">{title}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-mono uppercase text-[9px] tracking-wider">Attack Type</span>
              <span className="text-black font-semibold">{reportData.vectorName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-mono uppercase text-[9px] tracking-wider">Target Environment</span>
              <span className="text-black font-semibold">{reportData.industryName} ({reportData.targetName})</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-mono uppercase text-[9px] tracking-wider">Generated Date</span>
              <span className="text-black font-semibold">{new Date(reportData.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-mono uppercase text-[9px] tracking-wider">Report ID</span>
              <span className="text-black font-mono font-semibold">{reportId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono uppercase text-[9px] tracking-wider">Platform</span>
              <span className="text-slate-650">Generated using Sentinel</span>
            </div>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="w-full border-t border-slate-200 pt-6 flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          <div>Educational Simulation Report</div>
          <div>SENTINEL &copy; 2026</div>
        </div>
      </div>

      {/* =========================================================
          MAIN REPORT CONTAINER (WITH REPEATING HEADER/FOOTER)
          ========================================================= */}
      <table className="w-full border-none">
        {/* Repeating Header */}
        <thead>
          <tr>
            <td className="border-none pb-6">
              <div className="flex justify-between items-center border-b border-slate-300 pb-2 mb-4 text-[9px] font-mono text-slate-500">
                <div className="flex items-center gap-1.5 font-bold text-black uppercase tracking-wider">
                  <div className="w-5 h-5 rounded bg-black flex items-center justify-center text-white font-mono font-extrabold text-[10px]">
                    S
                  </div>
                  <span>SENTINEL</span>
                </div>
                <div className="uppercase font-bold max-w-sm truncate text-slate-700">
                  {title}
                </div>
                <div className="text-right leading-tight">
                  <div>ID: {reportId}</div>
                  <div>PAGE <span className="page-num"></span> OF <span className="page-total"></span></div>
                </div>
              </div>
            </td>
          </tr>
        </thead>

        {/* Repeating Footer */}
        <tfoot>
          <tr>
            <td className="border-none pt-6">
              <div className="flex justify-between items-center border-t border-slate-200 pt-2.5 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                <div>&copy; 2026 Sentinel</div>
                <div>Interactive Cybersecurity Learning Platform</div>
                <div>Page <span className="page-num"></span> of <span className="page-total"></span></div>
              </div>
            </td>
          </tr>
        </tfoot>

        {/* Main Content Body */}
        <tbody className="border-none">
          <tr>
            <td className="border-none p-0">
              <div className="space-y-8 flex flex-col justify-start">
                
                {/* Section 1: Executive Summary */}
                <div className="print-section">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-1.5 mb-3">
                    1. Executive Summary
                  </h2>
                  <div className="space-y-2.5 text-xs text-slate-800 leading-relaxed font-sans">
                    <p><strong>Scenario:</strong> An emulation mimicking threat actor <strong>{reportData.actorName}</strong> was conducted against simulated target systems in the {reportData.industryName.toLowerCase()} sector.</p>
                    <p><strong>Entry Vector:</strong> The simulation targeted the database host <strong>{reportData.targetName}</strong> via <strong>{reportData.vectorName.toLowerCase()}</strong> access channels.</p>
                    <p><strong>Outcome:</strong> {isBlocked ? (
                      <span>Defensive controls successfully intercepted the threat. Passive and active rules detected the intrusion, blocking propagation before network-wide lateral movements occurred.</span>
                    ) : (
                      <span>Defensive security rules failed to contain the intrusion. The threat actor successfully bypassed active EDR firewalls, established network footholds, and executed lateral pivoting.</span>
                    )}</p>
                    <p className="mt-2"><strong>Summary:</strong> {reportData.executiveSummary || summary}</p>
                  </div>
                </div>

                {/* Section 2: Attack Overview */}
                <div className="print-section">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-1.5 mb-3">
                    2. Attack Overview
                  </h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-sans text-slate-700 mb-4">
                    <div><strong>Target Environment:</strong> {reportData.industryName} ({reportData.targetName})</div>
                    <div><strong>Scenario Profile:</strong> {reportData.actorName} Campaign</div>
                    <div><strong>Attack Method:</strong> {reportData.vectorName}</div>
                    <div><strong>Outcome Rating:</strong> {isBlocked ? (
                      <span className="text-green-700 font-bold uppercase text-[10px]">Threat Containment Successful</span>
                    ) : (
                      <span className="text-red-700 font-bold uppercase text-[10px]">System Compromise / Breach Executed</span>
                    )}</div>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans mt-2">
                    {summary}
                  </p>
                </div>

                {/* Section 3: Attack Timeline */}
                <div className="print-section">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-1.5 mb-3">
                    3. Attack Timeline
                  </h2>
                  <div className="space-y-3 text-xs">
                    {timeline.map((stage, idx) => {
                      const isUnreached = stage.whatHappened === "This stage was not reached.";
                      const isStageBlocked = reportData.stages[idx]?.status === "blocked";
                      const isStageAlerted = reportData.stages[idx]?.status === "alerted";
                      const stageSeverity = reportData.stages[idx]?.severity || "medium";

                      return (
                        <div key={idx} className="p-3 border-b border-slate-100 last:border-0" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                          <div className="flex justify-between items-center font-bold font-mono text-[9px] pb-1 mb-1">
                            <span className="text-slate-850 uppercase font-sans">Phase {idx + 1}: {stage.title}</span>
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(stageSeverity)}
                              <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-bold border ${isUnreached ? "bg-slate-100 border-slate-200 text-slate-400" : isStageBlocked ? "bg-green-50 border-green-200 text-green-750" : isStageAlerted ? "bg-blue-50 border-blue-200 text-blue-750" : "bg-red-50 border-red-200 text-red-750"}`}>
                                {isUnreached ? "UNREACHED" : isStageBlocked ? "BLOCKED" : isStageAlerted ? "ALERTED" : "EVADED"}
                              </span>
                            </div>
                          </div>
                          <p className="leading-relaxed text-[11px] text-slate-750 font-sans">
                            <strong>Activity:</strong> {stage.whatHappened}
                          </p>
                          {!isUnreached && (
                            <p className="mt-1 leading-relaxed text-[11px] text-slate-600 font-sans">
                              <strong>Outcome:</strong> {stage.outcome}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: MITRE ATT&CK Mapping */}
                <div className="print-section">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-1.5 mb-3">
                    4. MITRE ATT&CK Mapping
                  </h2>
                  <table className="w-full border border-slate-200 border-collapse text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                        <th className="p-2 border-r border-slate-200 w-16">Phase</th>
                        <th className="p-2 border-r border-slate-200">Stage Activity</th>
                        <th className="p-2 border-r border-slate-200 w-24">MITRE Technique</th>
                        <th className="p-2 border-r border-slate-200">Technique Name</th>
                        <th className="p-2 border-r border-slate-200 w-24">Severity</th>
                        <th className="p-2 w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.stages.map((stage, idx) => {
                        const customMapping = reportData.mitreMapping?.find((m: { stageIndex: number; code: string; name: string }) => m.stageIndex === idx);
                        const mapping = customMapping
                          ? { code: customMapping.code, name: customMapping.name }
                          : getMitreAttackMapping(reportData.vectorId, idx);
                        const isStageBlocked = stage.status === "blocked";
                        const isStageAlerted = stage.status === "alerted";
                        const isUnreached = reportData.stages.slice(0, idx).some(s => s.status === "blocked");
                        
                        return (
                          <tr key={idx} className="border-b border-slate-200 odd:bg-white even:bg-slate-50/20">
                            <td className="p-2 border-r border-slate-200 font-mono text-[10px]">Phase {idx + 1}</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">{stage.title}</td>
                            <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{isUnreached ? "N/A" : mapping.code}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-600">{isUnreached ? "N/A" : mapping.name}</td>
                            <td className="p-2 border-r border-slate-200">
                              {isUnreached ? <span className="text-slate-400 font-mono text-[10px]">-</span> : getSeverityBadge(stage.severity)}
                            </td>
                            <td className="p-2 font-mono text-[9px] font-bold">
                              {isUnreached ? (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200 uppercase">Unreached</span>
                              ) : isStageBlocked ? (
                                <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 uppercase">Blocked</span>
                              ) : isStageAlerted ? (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">Alerted</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 uppercase">Evaded</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Section 5: Risk Assessment */}
                <div className="print-section">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-1.5 mb-3">
                    5. Risk Assessment
                  </h2>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans mb-4">
                    {whySecurityStruggled}
                  </p>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 font-mono">
                    Impact & Business Risk Metrics
                  </h3>
                  <table className="w-full border border-slate-200 border-collapse text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                        <th className="p-2 border-r border-slate-200 w-1/3">Risk Category</th>
                        <th className="p-2">Observed Metric / Security Output</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200 odd:bg-white even:bg-slate-50/20">
                        <td className="p-2 border-r border-slate-200 font-semibold">Current Risk Level Rating</td>
                        <td className="p-2 font-medium">{reportData.currentRisk}%</td>
                      </tr>
                      <tr className="border-b border-slate-200 odd:bg-white even:bg-slate-50/20">
                        <td className="p-2 border-r border-slate-200 font-semibold">Projected Remediation Risk Level</td>
                        <td className="p-2 font-medium">{reportData.projectedRisk}%</td>
                      </tr>
                      <tr className="border-b border-slate-200 odd:bg-white even:bg-slate-50/20">
                        <td className="p-2 border-r border-slate-200 font-semibold">Target Risk Reduction Delta</td>
                        <td className="p-2 font-medium text-blue-700 font-bold">{reportData.riskReduction}%</td>
                      </tr>
                      <tr className="border-b border-slate-200 odd:bg-white even:bg-slate-50/20">
                        <td className="p-2 border-r border-slate-200 font-semibold">Financial Exposure</td>
                        <td className="p-2 text-slate-650">{reportData.financialLoss}</td>
                      </tr>
                      <tr className="border-b border-slate-200 odd:bg-white even:bg-slate-50/20">
                        <td className="p-2 border-r border-slate-200 font-semibold">Operational Impact</td>
                        <td className="p-2 text-slate-650">{reportData.operationalImpact}</td>
                      </tr>
                      <tr className="odd:bg-white even:bg-slate-50/20">
                        <td className="p-2 border-r border-slate-200 font-semibold">Estimated System Downtime</td>
                        <td className="p-2 text-slate-650">{reportData.downtime}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 6: Recommendations */}
                <div className="print-section">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-1.5 mb-3">
                    6. Recommendations
                  </h2>
                  <div className="grid grid-cols-1 gap-2.5">
                    {preventions.map((prev, idx) => (
                      <div key={idx} className="p-3 border border-slate-100 rounded flex items-start gap-3 bg-slate-50/10" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                        <span className="text-base leading-none pt-0.5 text-blue-600">{prev.icon}</span>
                        <div className="text-xs font-sans">
                          <strong className="text-black font-mono block uppercase text-[9px] text-blue-700">{prev.rank}: {prev.name}</strong>
                          <p className="text-slate-650 mt-1 leading-relaxed">{prev.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 7: Key Takeaways */}
                <div className="print-section">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-1.5 mb-3">
                    7. Key Takeaways
                  </h2>
                  <div className="space-y-4 text-xs text-slate-800 leading-relaxed font-sans">
                    <ul className="list-decimal pl-5 space-y-1.5">
                      {lessons.slice(0, 3).map((lesson, idx) => (
                        <li key={idx}><strong>Core Lesson {idx + 1}:</strong> {lesson}</li>
                      ))}
                    </ul>
                    <div className="border-t border-slate-150 pt-3 mt-3">
                      <p className="italic text-slate-600 pl-2 border-l-2 border-blue-500 font-sans">
                        &ldquo;{reflection}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 8: Report Summary */}
                <div className="print-section">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-1.5 mb-3">
                    8. Report Summary
                  </h2>
                  <table className="w-full border border-slate-200 border-collapse text-left text-xs font-sans">
                    <tbody>
                      <tr className="border-b border-slate-200 bg-slate-50/20">
                        <td className="p-2 border-r border-slate-200 font-bold w-48">Simulation</td>
                        <td className="p-2 text-slate-800 font-medium">{title}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 border-r border-slate-200 font-bold">Overall Risk Rating</td>
                        <td className="p-2 text-slate-800">{reportData.currentRisk}% ({reportData.securityLevel} Security Level)</td>
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50/20">
                        <td className="p-2 border-r border-slate-200 font-bold">Primary Weakness</td>
                        <td className="p-2 text-slate-800">{getPrimaryWeakness(reportData.vectorId)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 border-r border-slate-200 font-bold">Recommended Improvements</td>
                        <td className="p-2 text-slate-800">{getTopImprovement(reportData.vectorId)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-slate-200 font-bold">Platform</td>
                        <td className="p-2 text-slate-500 font-mono text-[10px]">Generated using Sentinel</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

function AIAnalystContent() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaignId");

  const [campaign, setCampaign] = useState<StoredCampaign | null>(null);
  const [reportData, setReportData] = useState<CTIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLiveAI, setIsLiveAI] = useState(false);
  const [activeMenuSection, setActiveMenuSection] = useState("exec-summary");
  const [copied, setCopied] = useState(false);
  const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(false);
  const [showFullTimeline, setShowFullTimeline] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  useEffect(() => {
    // 1. Load Campaign
    const history = getCampaignHistory();
    let resolvedCampaign: StoredCampaign | null = null;

    if (campaignId) {
      resolvedCampaign = history.find(c => c.id === campaignId) || null;
    }

    if (!resolvedCampaign && typeof window !== "undefined") {
      const saved = sessionStorage.getItem("sentinel_campaign_config");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
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

    // Call server API for live Gemini analysis!
    const fetchAIReport = async (camp: StoredCampaign) => {
      setCampaign(camp);
      setLoading(true);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(camp),
        });

        if (!res.ok) throw new Error(`Server returned status: ${res.status}`);

        const data = await res.json();

        if (data.isFallback) {
          console.warn("[SENTINEL] Live Gemini API not configured or returned fallback. Using local generator.");
          setReportData(generateCTIReport(camp));
          setIsLiveAI(false);
        } else {
          console.log("[SENTINEL] Live Gemini CTI report generated successfully.");
          setReportData({
            id: camp.id,
            timestamp: camp.timestamp,
            actorName: getActorName(camp.threatActor),
            actorId: camp.threatActor,
            vectorName: getAttackName(camp.attackType),
            vectorId: camp.attackType,
            industryName: getIndustryName(camp.industry),
            targetName: camp.primaryTarget,
            status: camp.status,
            securityLevel: camp.securityLevel,
            executiveSummary: data.executiveSummary,
            actorProfile: data.actorProfile,
            financialLoss: data.businessImpact.financialLoss,
            operationalImpact: data.businessImpact.operationalImpact,
            downtime: data.businessImpact.downtime,
            mitigations: data.mitigations,
            currentRisk: data.riskAssessment.currentRisk,
            projectedRisk: data.riskAssessment.projectedRisk,
            riskReduction: data.riskAssessment.riskReduction,
            stages: camp.stages,
            mitreMapping: data.mitreMapping
          });
          setIsLiveAI(true);
        }
      } catch (error) {
        console.error("[SENTINEL ERROR] Fetching Gemini report failed. Using local compiler:", error);
        setReportData(generateCTIReport(camp));
        setIsLiveAI(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAIReport(resolvedCampaign);
    if (typeof window !== "undefined") {
      const currentMax = parseInt(sessionStorage.getItem("sentinel_max_unlocked_step") || "1", 10);
      if (currentMax < 4) {
        sessionStorage.setItem("sentinel_max_unlocked_step", "4");
        window.dispatchEvent(new Event("sentinel_progress_update"));
      }
    }
  }, [campaignId]);

  // Export report to Markdown
  const handleExportMarkdown = () => {
    if (!reportData) return;
    const dateStr = new Date(reportData.timestamp).toUTCString();

    const mitreMappingStr = reportData.stages.map((stage: CampaignStage, idx: number) => {
      const customMapping = reportData.mitreMapping?.find((m: { stageIndex: number; code: string; name: string }) => m.stageIndex === idx);
      const mapping = customMapping
        ? { code: customMapping.code, name: customMapping.name }
        : getMitreAttackMapping(reportData.vectorId, idx);
      return `Phase ${idx + 1}: ${stage.title} -> MITRE ATT&CK: ${mapping.code} [${mapping.name}] - Status: ${stage.status.toUpperCase()}`;
    }).join("\n");

    const content = `# SENTINEL CYBER THREAT INTELLIGENCE (CTI) REPORT
Generated: ${new Date().toUTCString()}
Campaign Reference: ${reportData.id}
Telemetry Log Time: ${dateStr}

======================================================================
1. QUICK SUMMARY
----------------------------------------------------------------------
${reportData.executiveSummary}

======================================================================
2. ATTACKER PROFILE: ${reportData.actorName.toUpperCase()}
----------------------------------------------------------------------
${reportData.actorProfile}

======================================================================
3. ATTACK TECHNIQUES USED (MITRE ATT&CK)
----------------------------------------------------------------------
${mitreMappingStr}

======================================================================
4. POTENTIAL DAMAGE ESTIMATE
----------------------------------------------------------------------
Adversary Target Endpoint: ${reportData.targetName}
Operational Downtime: ${reportData.downtime}
Financial Liability Impact: ${reportData.financialLoss}
Core Infrastructure Impact: ${reportData.operationalImpact}

======================================================================
5. RECOMMENDED SECURITY IMPROVEMENTS
----------------------------------------------------------------------
${reportData.mitigations.map((mit: string, i: number) => `${i + 1}. [Mitigation] ${mit}`).join("\n")}

======================================================================
6. RISK REDUCTION ESTIMATE
----------------------------------------------------------------------
Current Infrastructure Risk: ${reportData.currentRisk}%
Projected Risk Post-Remediation: < 5%
Net Security Posture Risk Reduction: ${reportData.riskReduction}%

======================================================================
Report Generated Authenticated by Sentinel AI Security Core Node
VERIFICATION TELEMETRY: COMPLETED // DEFENSE BLOCK STATUS: ${reportData.status.toUpperCase()}
`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SENTINEL-CTI-Report-${reportData.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // High-fidelity dynamic analysis loading screen
  if (loading || !reportData || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-bg text-cyber-cyan font-mono text-xs uppercase tracking-widest">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
          <span className="relative flex h-8 w-8">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-8 w-8 bg-cyber-cyan/35 flex items-center justify-center border border-cyber-cyan/50">
              <Brain className="w-4 h-4 text-cyber-cyan animate-pulse animate-duration-1000" />
            </span>
          </span>
          <div className="space-y-1">
            <div className="font-extrabold text-white uppercase tracking-[0.12em]">Preparing Your Review</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed">
            Consulting security mentor & compiling review...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const attackAttempt = `An attacker representing ${reportData.actorName} attempted to gain access to the ${reportData.industryName} environment targeting the ${reportData.targetName} systems using ${reportData.vectorName.toLowerCase()} techniques.`;

  const defenseResponse = reportData.status === "Blocked"
    ? `Defensive security systems running under ${getSecurityLevelName(reportData.securityLevel)} Protection successfully detected the suspicious intrusion activity in its early stages and intervened to block the threat.`
    : `Security controls configured under ${getSecurityLevelName(reportData.securityLevel)} Protection failed to contain the intrusion, allowing the attacker to bypass access boundaries and establish network connections.`;

  const finalOutcome = reportData.status === "Blocked"
    ? `No sensitive database files or customer records were exposed, and the attacker was successfully stopped before reaching critical systems.`
    : `Sensitive database tables were accessed and files were locked. The attacker successfully compromised critical systems, resulting in estimated data exposure.`;

  return (
    <div
      style={{ overflowAnchor: "none" }}
      className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-cyber-bg text-slate-100 selection:bg-electric-blue/30 selection:text-white print:bg-white print:text-black font-sans"
    >
      {/* Background elements - hidden on print */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none z-0 print:hidden" />
      <div className="absolute inset-0 cyber-grid-fine opacity-50 pointer-events-none z-0 print:hidden" />
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-10 print:hidden" />
      <div className="fixed inset-0 pointer-events-none z-50 animate-scanline bg-gradient-to-b from-transparent via-cyber-cyan/[0.012] to-transparent h-16 w-full print:hidden" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-6 relative z-10 w-full flex-grow pt-8 pb-12 print:hidden"
      >
        {/* Navigation back and telemetry info - hidden on print */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4 print:hidden font-mono text-[10px]">
          <Link
            href="/command-center"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white uppercase transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Learning Journal
          </Link>

          <div className="flex items-center gap-4 text-slate-400 tracking-wider">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-cyber-border bg-black/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-cyan"></span>
              </span>
              Simulation Review
            </span>
          </div>
        </div>

        <JourneyStepper currentStep={3} />

        {/* Title Header - print:hidden */}
        <div className="mb-10 max-w-4xl print:hidden flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-cyber-cyan text-[10px] font-mono tracking-widest uppercase font-bold">
              <Brain className="w-3.5 h-3.5 text-cyber-cyan animate-pulse" />
              Simulation Review
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase font-sans">
              Simulation Review
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
              See how the attack unfolded, what impact it had, and how security defenses responded.
            </p>
          </div>

          <div>
            {reportData.status === "Blocked" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyber-green/30 bg-cyber-green/10 text-cyber-green text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                🟢 Attack Successfully Blocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyber-red/30 bg-cyber-red/10 text-cyber-red text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                🔴 Attack Reached Critical Systems
              </span>
            )}
          </div>
        </div>

        {/* Print Only Header: Visible only during browser print */}
        <div className="hidden print:block font-mono text-black border-b-2 border-black pb-4 mb-8">
          <h1 className="text-2xl font-bold uppercase">Sentinel Simulation Results Summary</h1>
          <div className="grid grid-cols-2 gap-4 text-[10px] mt-2">
            <div><strong>Report Reference:</strong> {reportData.id}</div>
            <div><strong>Attacker Profile:</strong> {reportData.actorName}</div>
            <div><strong>Attack Method:</strong> {reportData.vectorName}</div>
            <div><strong>Target Environment:</strong> {reportData.industryName} ({reportData.targetName})</div>
            <div><strong>Simulation Status:</strong> {reportData.status === "Blocked" ? "BLOCKED" : "SUCCESSFUL"}</div>
            <div><strong>Timestamp:</strong> {new Date(reportData.timestamp).toUTCString()}</div>
          </div>
        </div>

        {/* Action Controls - hidden on print */}
        <div className="glassmorphism-card rounded-xl p-4 border border-cyber-border mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
            <span className="text-slate-400">TARGET REF:</span>
            <span className="text-white font-bold">{reportData.id}</span>
            <span className="text-slate-655">|</span>
            <span className="text-slate-400">ATTACKER:</span>
            <span className="text-white font-bold uppercase">{reportData.actorName}</span>
            <span className="text-slate-655">|</span>
            <span className="text-slate-400">PROTECTION:</span>
            <span className="text-white font-bold uppercase">{getSecurityLevelName(reportData.securityLevel)}</span>
            <span className="text-slate-655">|</span>
            {isLiveAI ? (
              <span className="px-1.5 py-0.5 rounded border border-cyber-cyan/30 bg-cyber-cyan/10 text-cyber-cyan text-[8px] font-bold uppercase tracking-wider animate-pulse">
                AI Intelligence Synced
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-500 text-[8px] font-bold uppercase tracking-wider">
                Review Generated
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-cyber-border bg-cyber-surface hover:bg-cyber-surface-brighter hover:text-white text-slate-300 text-[10px] tracking-widest uppercase transition-colors cursor-pointer font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Summary
            </button>
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-cyber-cyan/35 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              Download Report
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-purple-500/35 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] cursor-pointer font-bold relative"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "Link Copied!" : "Share Simulation"}
            </button>
          </div>
        </div>

        {/* Unified Single-Column Flow        {/* Unified Single-Column Flow Layout */}
        <div className="space-y-10 max-w-5xl mx-auto">
                {/* 1. What Happened? */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent" />
            <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-4 mb-6">
              <span className="text-cyber-cyan font-mono text-[10px] uppercase font-bold tracking-wider">🕵️ 1. What Happened?</span>
            </div>
            <div className="space-y-4 font-sans text-xs leading-relaxed text-slate-300">
              <p className="text-slate-200 text-sm font-semibold leading-relaxed">
                {attackAttempt} {finalOutcome}
              </p>
              <div className="p-4 rounded-lg bg-cyber-surface/40 border border-cyber-border/60">
                <strong className="text-white font-mono text-[9px] uppercase tracking-wider block mb-1 text-cyber-cyan">Scenario Overview</strong>
                <p className="text-slate-300">{reportData.executiveSummary}</p>
              </div>

              {/* Milestones timeline embedded here */}
              <div className="mt-6">
                <span className="text-slate-500 font-mono text-[9px] uppercase tracking-widest block font-bold mb-4">Progression Milestones</span>
                {(() => {
                  const stages = reportData.stages;
                  const isStep1Blocked = stages[0]?.status === "blocked" || stages[1]?.status === "blocked";
                  const isStep2Blocked = !isStep1Blocked && (stages[2]?.status === "blocked" || stages[3]?.status === "blocked" || stages[4]?.status === "blocked");
                  const isStep3Blocked = !isStep1Blocked && !isStep2Blocked && (stages[5]?.status === "blocked");

                  const milestones = [
                    {
                      title: "Looking for Entry",
                      desc: `Attacker performed network scans and delivered payloads via ${reportData.vectorName}.`,
                      status: isStep1Blocked ? "Stopped" : "Successful"
                    },
                    {
                      title: "Pivoting Inside",
                      desc: "Attacker searched memory for credentials and pivoted to database server zones.",
                      status: isStep1Blocked ? "Unreached" : isStep2Blocked ? "Stopped" : "Successful"
                    },
                    {
                      title: "Data Target",
                      desc: "Attacker reached the target directory to copy files and lock directories.",
                      status: (isStep1Blocked || isStep2Blocked) ? "Unreached" : isStep3Blocked ? "Stopped" : "Successful"
                    }
                  ];

                  return (
                    <div className="relative border-l border-cyber-border/80 pl-6 space-y-4 ml-3">
                      {milestones.map((milestone, idx) => {
                        const stepStatus = milestone.status;
                        return (
                          <div key={idx} className={`relative transition-all duration-300 ${stepStatus === "Unreached" ? "opacity-30" : "opacity-100"}`}>
                            <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border flex items-center justify-center font-mono text-[8px] font-bold ${
                              stepStatus === "Stopped"
                                ? "bg-black border-cyber-green text-cyber-green shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                : stepStatus === "Successful"
                                  ? "bg-cyber-red border-cyber-red text-black"
                                  : "bg-slate-950 border-slate-800 text-slate-655"
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="p-3.5 rounded-lg bg-cyber-surface/30 border border-cyber-border/40 flex justify-between items-center gap-4">
                              <div className="font-sans text-xs">
                                <h5 className="font-bold text-white font-mono uppercase tracking-wide text-[10px]">{milestone.title}</h5>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{milestone.desc}</p>
                              </div>
                              <div className="shrink-0 font-mono text-[8px] font-bold uppercase tracking-wider">
                                {stepStatus === "Stopped" && <span className="text-cyber-green">🟢 Stopped</span>}
                                {stepStatus === "Successful" && <span className="text-cyber-red">🔴 Succeeded</span>}
                                {stepStatus === "Unreached" && <span className="text-slate-500">⚪ Unreached</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-mono text-slate-400 pt-4">
                <div className="bg-black/35 p-3 rounded border border-cyber-border">
                  <span className="text-slate-505 text-cyber-cyan uppercase block text-[8px] font-bold">Target Environment</span>
                  <span className="text-white font-bold block mt-1 uppercase">{reportData.industryName} ({reportData.targetName})</span>
                </div>
                <div className="bg-black/35 p-3 rounded border border-cyber-border">
                  <span className="text-slate-505 text-cyber-cyan uppercase block text-[8px] font-bold">Threat Actor</span>
                  <span className="text-white font-bold block mt-1 uppercase">{reportData.actorName}</span>
                </div>
                <div className="bg-black/35 p-3 rounded border border-cyber-border">
                  <span className="text-slate-505 text-cyber-cyan uppercase block text-[8px] font-bold">Attack Method</span>
                  <span className="text-white font-bold block mt-1 uppercase">{reportData.vectorName}</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 2. Attack Journey */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent" />
            <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-4 mb-6">
              <span className="text-cyber-cyan font-mono text-[10px] uppercase font-bold tracking-wider">🗺️ 2. Attack Journey</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 py-6 px-4 bg-black/40 rounded border border-cyber-border/40">
              {getAttackJourneyFlow(reportData.vectorId).map((step, idx, arr) => (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center p-3 rounded-lg border border-cyber-cyan/20 bg-cyber-cyan/5 w-full md:w-44 text-center">
                    <span className="text-[10px] font-mono text-cyber-cyan font-bold block mb-1">STEP 0{idx + 1}</span>
                    <span className="text-white text-[11px] font-medium leading-tight">{step}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="text-cyber-cyan/60 font-mono text-base font-bold my-1 md:my-0">
                      <span className="md:hidden">↓</span>
                      <span className="hidden md:inline">→</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.section>

          {/* 3. Why The Attack Succeeded / Was Blocked */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent" />
            <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-4 mb-6">
              <span className="text-cyber-cyan font-mono text-[10px] uppercase font-bold tracking-wider">
                🛡️ 3. Why The Attack {reportData.status === "Blocked" ? "Was Blocked" : "Succeeded"}
              </span>
            </div>
            <div className="space-y-4 font-sans text-xs leading-relaxed text-slate-300">
              <p className="text-slate-200 text-sm font-semibold leading-relaxed">
                {defenseResponse}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-black/35 p-4 rounded border border-cyber-border">
                  <span className="text-slate-500 uppercase block font-mono text-[8px] font-bold">Security Setup (Defensive Posture)</span>
                  <span className="text-cyber-cyan font-extrabold block mt-1 uppercase text-sm font-mono">
                    {getSecurityLevelName(reportData.securityLevel)} Protection
                  </span>
                  <p className="text-slate-400 text-[10px] mt-1.5 leading-normal">
                    This setup governs which security rules, alert policies, and access checks were active during the simulation.
                  </p>
                </div>
                <div className="bg-black/35 p-4 rounded border border-cyber-border">
                  <span className="text-slate-500 uppercase block font-mono text-[8px] font-bold">Security Gap (Vulnerability)</span>
                  <span className={`font-extrabold block mt-1 uppercase text-sm font-mono ${reportData.status === "Blocked" ? "text-cyber-green" : "text-cyber-red"}`}>
                    {reportData.status === "Blocked" ? "Fully Protected" : "Exposed Vulnerability"}
                  </span>
                  <p className="text-slate-400 text-[10px] mt-1.5 leading-normal">
                    {reportData.status === "Blocked" 
                      ? "Active defenses successfully blocked threat behavior patterns and prevented the attacker from reaching critical zones." 
                      : "Unsecured paths or a lack of strict access controls allowed the payload to run and pivot to other servers."}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 4. What The Attacker Achieved */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent" />
            <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-4 mb-6">
              <span className="text-cyber-cyan font-mono text-[10px] uppercase font-bold tracking-wider">💰 4. What The Attacker Achieved</span>
            </div>
            
            <div className="space-y-6 text-xs leading-relaxed">
              <div className="p-4 rounded bg-cyber-surface/40 border border-cyber-border/60">
                <span className="text-white font-mono text-[9px] uppercase tracking-wider block font-bold text-cyber-cyan mb-1">Possible Business Impact</span>
                <p className="text-slate-355">
                  {reportData.status === "Blocked"
                    ? "The attack was successfully contained. The attacker failed to reach the database, keeping operational disruption and cost to a minimum."
                    : "The attack succeeded in bypassing defenses. Critical servers were accessed, which would lead to operational halts, potential regulatory violations, and reputational damage."}
                </p>
              </div>

              {(() => {
                const details = getImpactDetails(reportData.vectorId, reportData.industryName, reportData.status === "Blocked");
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* What Systems Were Affected */}
                    <div className="bg-black/35 p-4 rounded border border-cyber-border/40">
                      <span className="text-white font-mono text-[10px] uppercase tracking-wider block font-bold mb-3 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyber-cyan" />
                        What Systems Were Affected?
                      </span>
                      <ul className="space-y-2 text-[11px] text-slate-300">
                        {details.systems.map((sys, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="text-cyber-red font-bold">•</span>
                            {sys}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Possible Consequences */}
                    <div className="bg-black/35 p-4 rounded border border-cyber-border/40">
                      <span className="text-white font-mono text-[10px] uppercase tracking-wider block font-bold mb-3 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        What Problems Would This Cause?
                      </span>
                      <ul className="space-y-2 text-[11px] text-slate-300">
                        {details.consequences.map((cons, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="text-cyber-red font-bold">•</span>
                            {cons}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* How Long Might Recovery Take */}
                    <div className="bg-black/35 p-4 rounded border border-cyber-border/40">
                      <span className="text-white font-mono text-[10px] uppercase tracking-wider block font-bold mb-2 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyber-cyan" />
                        How Long Might Recovery Take?
                      </span>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        {details.recovery}
                      </p>
                    </div>

                    {/* What Security Improvements Would Help */}
                    <div className="bg-black/35 p-4 rounded border border-cyber-border/40">
                      <span className="text-white font-mono text-[10px] uppercase tracking-wider block font-bold mb-3 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyber-green" />
                        What Security Improvements Would Help?
                      </span>
                      <ul className="space-y-2 text-[11px] text-slate-300">
                        {details.improvements.map((imp, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="text-cyber-green font-bold">✓</span>
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.section>

          {/* 5. How This Could Have Been Stopped */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent" />
            <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-4 mb-6">
              <span className="text-cyber-cyan font-mono text-[10px] uppercase font-bold tracking-wider">🛑 5. How This Could Have Been Stopped</span>
            </div>
            
            <div className="space-y-4">
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Applying the following security controls would have blocked the methods simulated during this attack:
              </p>
              
              <div className="space-y-3">
                {reportData.mitigations.map((mitigation, idx) => {
                  const parts = mitigation.split(":");
                  const title = parts[0] || "Security Control";
                  const desc = parts.slice(1).join(":") || mitigation;
                  return (
                    <div key={idx} className="p-3.5 rounded bg-cyber-surface/30 border border-cyber-border/40 flex items-start gap-3">
                      <div className="pt-0.5 shrink-0">
                        <div className="w-4.5 h-4.5 rounded border border-cyber-cyan/40 bg-cyber-cyan/5 flex items-center justify-center font-bold text-cyber-cyan text-[9px]">
                          ✓
                        </div>
                      </div>
                      <div className="font-sans text-xs">
                        <strong className="text-white font-mono text-[10px] uppercase tracking-wider block">{title}</strong>
                        <p className="text-slate-400 text-[11px] mt-0.5 leading-normal">{desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* 6. What You Should Learn */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism-card rounded-xl p-6 border border-cyber-border relative"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-cyan/30 via-transparent to-transparent" />
            <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-4 mb-6">
              <span className="text-cyber-cyan font-mono text-[10px] uppercase font-bold tracking-wider">🎓 6. What You Should Learn</span>
            </div>
            
            <div className="space-y-4 font-sans text-xs leading-relaxed text-slate-350">
              {(() => {
                const lessons = getEducationalLessons(reportData.vectorId, reportData.securityLevel);
                return (
                  <div className="space-y-4">
                    <div className="p-4 rounded bg-cyber-surface/40 border border-cyber-border/60">
                      <span className="text-white font-mono text-[9px] uppercase tracking-wider block font-bold text-cyber-cyan mb-1">Key Takeaway</span>
                      <p className="text-slate-205 text-[11px] leading-relaxed">
                        {lessons.keyTakeaway}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/35 p-4 rounded border border-cyber-border/40">
                        <span className="text-white font-mono text-[9px] uppercase tracking-wider block font-bold text-amber-500 mb-1.5">What Beginners Should Remember</span>
                        <p className="text-[11px] text-slate-400">
                          {lessons.whatBeginnersRemember}
                        </p>
                      </div>

                      <div className="bg-black/35 p-4 rounded border border-cyber-border/40">
                        <span className="text-white font-mono text-[9px] uppercase tracking-wider block font-bold text-purple-400 mb-1.5">Real-World Lesson</span>
                        <p className="text-[11px] text-slate-400">
                          {lessons.realWorldLesson}
                        </p>
                      </div>

                      <div className="bg-black/35 p-4 rounded border border-cyber-border/40">
                        <span className="text-white font-mono text-[9px] uppercase tracking-wider block font-bold text-cyber-red mb-1.5">Why This Attack Worked</span>
                        <p className="text-[11px] text-slate-400">
                          {lessons.whyAttackWorked}
                        </p>
                      </div>

                      <div className="bg-black/35 p-4 rounded border border-cyber-border/40">
                        <span className="text-white font-mono text-[9px] uppercase tracking-wider block font-bold text-cyber-green mb-1.5">How Defenders Could Improve</span>
                        <p className="text-[11px] text-slate-400">
                          {lessons.howDefendersImprove}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.section>

          {/* Section 6 & 7: Collapsible Technical Threat Intelligence */}
          <div className="w-full">
            <div className="p-5 rounded-lg border border-cyber-border bg-cyber-surface/30 mb-4 text-left print:hidden">
              <h4 className="text-white font-mono text-xs uppercase font-bold tracking-wider">Advanced Technical Details</h4>
              <p className="text-[10px] text-slate-400 mt-1 font-sans">
                For cybersecurity learners, analysts, and recruiters interested in deeper technical details.
              </p>
              <button
                onClick={() => setIsTechnicalExpanded(!isTechnicalExpanded)}
                className="mt-3 py-2 px-4 rounded border border-cyber-cyan/35 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan hover:text-white flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider transition-all duration-300 hover:cursor-pointer font-bold"
              >
                <Layers className="w-3.5 h-3.5 text-cyber-cyan animate-pulse" />
                <span>{isTechnicalExpanded ? "[-] Hide Advanced Technical Details" : "[+] View Advanced Technical Details"}</span>
              </button>
            </div>

            <AnimatePresence>
              {(isTechnicalExpanded || typeof window === "undefined" /* keep visible on print if server side */) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8 overflow-hidden pb-8 pt-2 print:block font-mono"
                >
                  {/* Threat Intelligence Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-[10px]">
                    <div className="bg-black/40 p-4 rounded-xl border border-cyber-border bg-black/40">
                      <div className="text-cyber-cyan text-[8px] uppercase tracking-wider">Who is behind the attack (Threat Actor)</div>
                      <div className="text-white font-bold mt-1.5 uppercase">
                        {getActorName(reportData.actorId, true)}
                      </div>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-cyber-border bg-black/40">
                      <div className="text-cyber-cyan text-[8px] uppercase tracking-wider">How the attack starts (Attack Vector)</div>
                      <div className="text-white font-bold mt-1.5 uppercase font-bold">
                        {getAttackName(reportData.vectorId, true)}
                      </div>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-cyber-border bg-black/40">
                      <div className="text-cyber-cyan text-[8px] uppercase tracking-wider">Internal Asset ID</div>
                      <div className="text-white font-bold mt-1.5 uppercase">
                        {reportData.targetName}
                      </div>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-cyber-border bg-black/40">
                      <div className="text-cyber-cyan text-[8px] uppercase tracking-wider">Defense Profile</div>
                      <div className="text-white font-bold mt-1.5 uppercase">
                        {getSecurityLevelName(reportData.securityLevel)}
                      </div>
                    </div>
                  </div>

                  {/* Attacker Threat Intel profile reference */}
                  <div className="bg-cyber-surface/40 border border-cyber-border p-5 rounded-xl">
                    <div className="text-cyber-cyan font-mono text-[10px] uppercase font-bold mb-3 font-bold">Adversary Threat Intelligence Profile (Advanced)</div>
                    <p className="text-slate-350 leading-relaxed text-[11px] font-sans">
                      {reportData.actorProfile}
                    </p>
                  </div>

                  {/* Adversary Attack Chain & Containment Flow */}
                  <div className="glassmorphism-card rounded-xl p-6 border border-cyber-border bg-black/40">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold mb-6">
                      Adversary Attack Chain & Containment Flow
                    </span>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[9px]">
                      {reportData.stages.map((stage, idx) => {
                        const isStageBlocked = stage.status === "blocked";
                        const isPriorStageBlocked = reportData.stages.slice(0, idx).some(s => s.status === "blocked");
                        const statusLabel = isPriorStageBlocked 
                          ? "UNREACHED" 
                          : isStageBlocked 
                          ? "BLOCKED" 
                          : "EVADED";
                        const statusColor = isPriorStageBlocked 
                          ? "text-slate-505 border-slate-800 bg-slate-950/20" 
                          : isStageBlocked 
                          ? "text-cyber-green border-cyber-green/45 bg-cyber-green/5 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                          : "text-cyber-red border-cyber-red/45 bg-cyber-red/5 shadow-[0_0_10px_rgba(244,63,94,0.1)]";
                          
                        return (
                          <React.Fragment key={idx}>
                            <div className={`flex-1 w-full p-3.5 rounded border ${statusColor} text-center flex flex-col justify-between min-h-[95px]`}>
                              <div className="opacity-50 text-[8px] uppercase font-mono">PHASE 0{idx + 1}</div>
                              <div className="font-bold text-white uppercase text-[9px] my-1 truncate" title={stage.title}>
                                {stage.title.split(" ").slice(0, 2).join(" ")}
                              </div>
                              <div className="font-bold">{statusLabel}</div>
                            </div>
                            {idx < reportData.stages.length - 1 && (
                              <ChevronRight className="w-4 h-4 text-slate-700 hidden md:block animate-pulse-subtle" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* MITRE, Controls & Detection Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* MITRE Card */}
                    <div className="bg-cyber-surface/40 border border-cyber-border p-5 rounded-xl">
                      <div className="text-cyber-cyan font-mono text-[10px] uppercase font-bold mb-4">Technical Reference (MITRE ATT&CK Mapping)</div>
                      <div className="space-y-2.5 font-mono text-[9px]">
                        {reportData.stages.map((stage: CampaignStage, idx: number) => {
                          const customMapping = reportData.mitreMapping?.find((m: { stageIndex: number; code: string; name: string }) => m.stageIndex === idx);
                          const mapping = customMapping
                            ? { code: customMapping.code, name: customMapping.name }
                            : getMitreAttackMapping(reportData.vectorId, idx);
                          return (
                            <div key={idx} className="flex justify-between items-center bg-black/40 p-2.5 border border-cyber-border/40 rounded">
                              <span className="text-white font-bold">{mapping.name.split(" (")[0]}</span>
                              <span className="text-cyber-cyan font-bold border border-cyber-cyan/30 px-1.5 py-0.5 rounded bg-cyber-cyan/5 ml-2 font-mono">{mapping.code}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Detection Rules Card */}
                    <div className="bg-cyber-surface/40 border border-cyber-border p-5 rounded-xl">
                      <div className="text-cyber-cyan font-mono text-[10px] uppercase font-bold mb-4">Detection Rules</div>
                      <ul className="space-y-2.5 text-[10px] text-slate-350 list-disc pl-4 font-sans leading-relaxed">
                        {reportData.vectorId === "Phishing" && (
                          <>
                            <li>Mail gateway SPF/DMARC verify alerts</li>
                            <li>Anomaly detection on credential inputs & headers</li>
                            <li>EDR alerts on process launches from browser temp paths</li>
                          </>
                        )}
                        {reportData.vectorId === "Ransomware" && (
                          <>
                            <li>Host telemetry monitoring file writing high frequency</li>
                            <li>Endpoint detection alerts on backup shadow copy deletes</li>
                            <li>Network firewall rules logging active encryption keys</li>
                          </>
                        )}
                        {reportData.vectorId === "DDoS" && (
                          <>
                            <li>Border gateway volume thresholds logging packet counts</li>
                            <li>DNS request rate verification on load balancer ports</li>
                            <li>SYN-flood detection alerts on gateway filters</li>
                          </>
                        )}
                        {reportData.vectorId === "SQL Injection" && (
                          <>
                            <li>Web Application Firewall checking SELECT/UNION keys</li>
                            <li>Database command logs flagging query validation fails</li>
                            <li>API gateway logging anomalous query parameter lengths</li>
                          </>
                        )}
                        {reportData.vectorId === "Supply Chain" && (
                          <>
                            <li>CI/CD build pipeline checksum verify alerts</li>
                            <li>Endpoint detection tracking unknown code execution paths</li>
                            <li>Proxy servers logging unauthorized outbound script downloads</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Indicators of Compromise (IOCs) */}
                    <div className="bg-cyber-surface/40 border border-cyber-border p-5 rounded-xl">
                      <div className="text-cyber-cyan font-mono text-[10px] uppercase font-bold mb-4">Indicators of Compromise (IOCs)</div>
                      <div className="space-y-3 font-mono text-[8px] text-slate-400">
                        <div>
                          <strong className="text-white block uppercase mb-1 text-[9px]">IP Addresses:</strong>
                          {getIocData(reportData.vectorId).ips.map((ip, index) => (
                            <div key={index} className="bg-black/30 p-1.5 rounded border border-cyber-border/40 mt-1">{ip}</div>
                          ))}
                        </div>
                        <div>
                          <strong className="text-white block uppercase mb-1 text-[9px]">File Hashes (MD5):</strong>
                          {getIocData(reportData.vectorId).hashes.map((hash, index) => (
                            <div key={index} className="bg-black/30 p-1.5 rounded border border-cyber-border/40 mt-1 truncate" title={hash}>{hash}</div>
                          ))}
                        </div>
                        <div>
                          <strong className="text-white block uppercase mb-1 text-[9px]">Network / Host Artifacts:</strong>
                          {getIocData(reportData.vectorId).artifacts.map((art, index) => (
                            <div key={index} className="bg-black/30 p-1.5 rounded border border-cyber-border/40 mt-1">{art}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </motion.div>

      {reportData && (
        <PrintCaseStudy reportData={reportData} />
      )}

      {/* Footer - hidden on print */}
      <div className="print:hidden">
        <Footer />
      </div>
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
          Preparing Your Review...
        </div>
      </div>
    }>
      <AIAnalystContent />
    </Suspense>
  );
}
