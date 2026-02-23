export interface AuditScore {
  score: number;
  max: number;
  findings: string[];
}

export interface AuditResult {
  project: string;
  timestamp: string;
  scores: {
    repository_knowledge: AuditScore;
    architecture_enforcement: AuditScore;
    agent_legibility: AuditScore;
    golden_principles: AuditScore;
    agent_workflow: AuditScore;
    garbage_collection: AuditScore;
  };
  total_score: number;
  max_score: 18;
  maturity_level: string;
  recommendations: string[];
}

export interface InitOptions {
  path: string;
  name: string;
  force: boolean;
  pack: string;
}

export type DoctorStatus = "pass" | "fail" | "warn";

export interface DoctorCheck {
  check: string;
  status: DoctorStatus;
  fix: string;
}

export interface EvolutionStep {
  step: number;
  action: string;
  description: string;
  automated: boolean;
}

export interface EvolutionPath {
  from: string;
  to: string;
  goal: string;
  steps: EvolutionStep[];
  success_criteria: string;
}
