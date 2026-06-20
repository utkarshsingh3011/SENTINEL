"use client";

export interface CampaignStage {
  title: string;
  description: string;
  log: string;
  status: "evaded" | "blocked" | "alerted";
  severity: "low" | "medium" | "high" | "critical";
}

export interface StoredCampaign {
  id: string;
  timestamp: string;
  threatActor: string;
  industry: string;
  attackType: string;
  riskScore: number;
  status: "Blocked" | "Successful";
  securityLevel: string;
  primaryTarget: string;
  stages: CampaignStage[];
}

// Helpers to resolve names from IDs
export const getActorName = (id: string): string => {
  const map: Record<string, string> = {
    APT29: "APT29 (CozyBear)",
    Lazarus: "Lazarus Group",
    LockBit: "LockBit 3.0",
    FIN7: "FIN7",
    Anonymous: "Anonymous",
  };
  return map[id] || id;
};

export const getAttackName = (id: string): string => {
  const map: Record<string, string> = {
    Phishing: "Spearphishing Link",
    Ransomware: "Data Encrypted",
    DDoS: "Volumetric Exhaustion",
    "Supply Chain": "Dependency Poisoning",
    "SQL Injection": "Blind SQL Injection",
  };
  return map[id] || id;
};

export const getIndustryName = (id: string): string => {
  return id; // IDs are same as names for industries
};

// Seed initial history if empty
const getMockCampaigns = (): StoredCampaign[] => {
  const now = new Date();
  
  const createPastDate = (hoursAgo: number) => {
    const d = new Date(now);
    d.setHours(d.getHours() - hoursAgo);
    return d.toISOString();
  };

  return [
    {
      id: "SIM-8492",
      timestamp: createPastDate(2),
      threatActor: "Lazarus",
      industry: "Banking",
      attackType: "SQL Injection",
      riskScore: 15,
      status: "Blocked",
      securityLevel: "High",
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
          description: "Foothold vector established using Blind SQL Injection to bypass gateway filtering.",
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
          log: "[ESCALATION] Token impersonation executed. Root credentials retrieved. EDR status: BLOCKED",
          status: "blocked",
          severity: "high",
        },
        {
          title: "Data Exfiltration & Impact",
          description: "Executing final payload actions on database target Swift-Transfer-Core. Archiving core customer tables.",
          log: "[EXFILTRATION] Compressing database files. Transmitting out of band over port 443. EDR status: BLOCKED",
          status: "blocked",
          severity: "critical",
        },
      ],
    },
    {
      id: "SIM-7301",
      timestamp: createPastDate(6),
      threatActor: "LockBit",
      industry: "Healthcare",
      attackType: "Ransomware",
      riskScore: 85,
      status: "Successful",
      securityLevel: "Low",
      primaryTarget: "EMR-Patient-DB",
      stages: [
        {
          title: "Reconnaissance & Port Scan",
          description: "Attacker LockBit 3.0 initiated active reconnaissance scans mapping the target subnets for Healthcare.",
          log: "[RECON] Mapping subnets on segment 10.0.4.x. Found open ports: 443, 8080. EDR status: EVADED",
          status: "evaded",
          severity: "low",
        },
        {
          title: "Initial Access Foothold",
          description: "Foothold vector established using Data Encrypted to bypass gateway filtering.",
          log: "[INGRESS] Exploit payload dispatched. Channel established with target client. EDR status: EVADED",
          status: "evaded",
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
          description: "Pivoting from compromised host endpoints to jump servers. Internal target segment reached: EMR-Patient-DB.",
          log: "[LATERAL] Remote session hijacked to cross network subnets. Target node reached: EMR-Patient-DB. EDR status: EVADED",
          status: "evaded",
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
          description: "Executing final payload actions on database target EMR-Patient-DB. Archiving core customer tables.",
          log: "[EXFILTRATION] Compressing database files. Transmitting out of band over port 443. EDR status: EVADED",
          status: "evaded",
          severity: "critical",
        },
      ],
    },
    {
      id: "SIM-5291",
      timestamp: createPastDate(20),
      threatActor: "APT29",
      industry: "Government",
      attackType: "Phishing",
      riskScore: 30,
      status: "Blocked",
      securityLevel: "High",
      primaryTarget: "Fed-Registry-SRV",
      stages: [
        {
          title: "Reconnaissance & Port Scan",
          description: "Attacker APT29 initiated active reconnaissance scans mapping the target subnets for Government.",
          log: "[RECON] Mapping subnets on segment 10.0.4.x. Found open ports: 443, 8080. EDR status: BLOCKED",
          status: "blocked",
          severity: "low",
        },
        {
          title: "Initial Access Foothold",
          description: "Foothold vector established using Phishing to bypass gateway filtering.",
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
          description: "Pivoting from compromised host endpoints to jump servers. Internal target segment reached: Fed-Registry-SRV.",
          log: "[LATERAL] Remote session hijacked to cross network subnets. Target node reached: Fed-Registry-SRV. EDR status: BLOCKED",
          status: "blocked",
          severity: "high",
        },
        {
          title: "Privilege Domain Escalation",
          description: "Attempting admin privilege elevation via token impersonation on Active Directory controller nodes.",
          log: "[ESCALATION] Token impersonation executed. Root credentials retrieved. EDR status: BLOCKED",
          status: "blocked",
          severity: "high",
        },
        {
          title: "Data Exfiltration & Impact",
          description: "Executing final payload actions on database target Fed-Registry-SRV. Archiving core customer tables.",
          log: "[EXFILTRATION] Compressing database files. Transmitting out of band over port 443. EDR status: BLOCKED",
          status: "blocked",
          severity: "critical",
        },
      ],
    },
    {
      id: "SIM-4220",
      timestamp: createPastDate(30),
      threatActor: "Anonymous",
      industry: "University",
      attackType: "DDoS",
      riskScore: 55,
      status: "Successful",
      securityLevel: "Medium",
      primaryTarget: "Research-NAS-Share",
      stages: [
        {
          title: "Reconnaissance & Port Scan",
          description: "Attacker Anonymous initiated active reconnaissance scans mapping the target subnets for University.",
          log: "[RECON] Mapping subnets on segment 10.0.4.x. Found open ports: 443, 8080. EDR status: BLOCKED",
          status: "blocked",
          severity: "low",
        },
        {
          title: "Initial Access Foothold",
          description: "Foothold vector established using Volumetric Exhaustion to bypass gateway filtering.",
          log: "[INGRESS] Exploit payload dispatched. Channel established with target client. EDR status: EVADED",
          status: "evaded",
          severity: "medium",
        },
        {
          title: "Credential Swipe",
          description: "Searching local memory dumps and active directory tables for active session tokens and admin keys.",
          log: "[CREDENTIALS] LSASS memory dump initiated / credential extraction requested. EDR status: BLOCKED",
          status: "blocked",
          severity: "medium",
        },
        {
          title: "Lateral Subnet Propagation",
          description: "Pivoting from compromised host endpoints to jump servers. Internal target segment reached: Research-NAS-Share.",
          log: "[LATERAL] Remote session hijacked to cross network subnets. Target node reached: Research-NAS-Share. EDR status: EVADED",
          status: "evaded",
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
          description: "Executing final payload actions on database target Research-NAS-Share. Archiving core customer tables.",
          log: "[EXFILTRATION] Compressing database files. Transmitting out of band over port 443. EDR status: EVADED",
          status: "evaded",
          severity: "critical",
        },
      ],
    },
    {
      id: "SIM-3105",
      timestamp: createPastDate(48),
      threatActor: "FIN7",
      industry: "Startup",
      attackType: "Phishing",
      riskScore: 12,
      status: "Blocked",
      securityLevel: "Enterprise",
      primaryTarget: "Kube-Master-Prod",
      stages: [
        {
          title: "Reconnaissance & Port Scan",
          description: "Attacker FIN7 initiated active reconnaissance scans mapping the target subnets for Startup.",
          log: "[RECON] Mapping subnets on segment 10.0.4.x. Found open ports: 443, 8080. EDR status: BLOCKED",
          status: "blocked",
          severity: "low",
        },
        {
          title: "Initial Access Foothold",
          description: "Foothold vector established using Spearphishing Link to bypass gateway filtering.",
          log: "[INGRESS] Exploit payload dispatched. Channel established with target client. EDR status: BLOCKED",
          status: "blocked",
          severity: "medium",
        },
        {
          title: "Credential Swipe",
          description: "Searching local memory dumps and active directory tables for active session tokens and admin keys.",
          log: "[CREDENTIALS] LSASS memory dump initiated / credential extraction requested. EDR status: BLOCKED",
          status: "blocked",
          severity: "medium",
        },
        {
          title: "Lateral Subnet Propagation",
          description: "Pivoting from compromised host endpoints to jump servers. Internal target segment reached: Kube-Master-Prod.",
          log: "[LATERAL] Remote session hijacked to cross network subnets. Target node reached: Kube-Master-Prod. EDR status: BLOCKED",
          status: "blocked",
          severity: "high",
        },
        {
          title: "Privilege Domain Escalation",
          description: "Attempting admin privilege elevation via token impersonation on Active Directory controller nodes.",
          log: "[ESCALATION] Token impersonation executed. Root credentials retrieved. EDR status: BLOCKED",
          status: "blocked",
          severity: "high",
        },
        {
          title: "Data Exfiltration & Impact",
          description: "Executing final payload actions on database target Kube-Master-Prod. Archiving core customer tables.",
          log: "[EXFILTRATION] Compressing database files. Transmitting out of band over port 443. EDR status: BLOCKED",
          status: "blocked",
          severity: "critical",
        },
      ],
    },
    {
      id: "SIM-2101",
      timestamp: createPastDate(72),
      threatActor: "Lazarus",
      industry: "Banking",
      attackType: "Supply Chain",
      riskScore: 55,
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
    },
  ];
};

export const getCampaignHistory = (): StoredCampaign[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("aegis_campaign_history");
  if (!stored) {
    const mocks = getMockCampaigns();
    localStorage.setItem("aegis_campaign_history", JSON.stringify(mocks));
    return mocks;
  }
  try {
    return JSON.parse(stored);
  } catch {
    const mocks = getMockCampaigns();
    localStorage.setItem("aegis_campaign_history", JSON.stringify(mocks));
    return mocks;
  }
};

export const saveCampaignToHistory = (campaign: any): StoredCampaign => {
  const history = getCampaignHistory();
  
  // Determine if this campaign is already saved (by timestamp or matching config details)
  const isAlreadySaved = history.some(
    (c) => c.timestamp === campaign.timestamp && c.industry === campaign.industry && c.threatActor === campaign.threatActor
  );

  if (isAlreadySaved) {
    return history.find(
      (c) => c.timestamp === campaign.timestamp && c.industry === campaign.industry && c.threatActor === campaign.threatActor
    )!;
  }

  // Derive Status: if last stage is "blocked", then overall is Blocked. Otherwise Successful.
  const finalStage = campaign.stages && campaign.stages.length > 0 
    ? campaign.stages[campaign.stages.length - 1] 
    : null;
  const status = finalStage && finalStage.status === "blocked" ? "Blocked" : "Successful";

  // Generate ID if missing
  const id = campaign.id || `SIM-${Math.floor(1000 + Math.random() * 9000)}`;

  const newRecord: StoredCampaign = {
    id,
    timestamp: campaign.timestamp || new Date().toISOString(),
    threatActor: campaign.threatActor,
    industry: campaign.industry,
    attackType: campaign.attackType,
    riskScore: campaign.riskFactor !== undefined ? campaign.riskFactor : 50,
    status,
    securityLevel: campaign.securityLevel || "Medium",
    primaryTarget: campaign.primaryTarget || "Unknown-Target",
    stages: campaign.stages || [],
  };

  const updated = [newRecord, ...history];
  localStorage.setItem("aegis_campaign_history", JSON.stringify(updated));
  return newRecord;
};
