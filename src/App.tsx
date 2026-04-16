import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  FileText, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Lightbulb, 
  Zap,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeMatch, AnalysisResult } from './gemini';

// --- Types ---
type Step = 'input' | 'analyse' | 'results';

// --- Components ---

const Header = () => (
  <header className="py-7 px-0 flex items-center gap-4 border-b border-border mb-10">
    <div className="w-10 h-10 bg-linear-to-br from-teal to-mint rounded-[10px] flex items-center justify-center font-mono font-bold text-base text-navy flex-shrink-0">
      R↔
    </div>
    <div className="font-mono text-lg font-bold -tracking-widest">
      Resu<span className="text-mint">Match</span>
    </div>
    <div className="ml-auto bg-mint/10 border border-mint/30 rounded-full px-3 py-1 text-[11px] font-semibold text-mint tracking-wider uppercase">
      AI • Gemini 3.1
    </div>
  </header>
);

const StepIndicator = ({ currentStep }: { currentStep: Step }) => {
  const steps: { id: Step; label: string; num: number }[] = [
    { id: 'input', label: 'Input', num: 1 },
    { id: 'analyse', label: 'Analyse', num: 2 },
    { id: 'results', label: 'Results', num: 3 },
  ];

  const getStatus = (stepId: Step, index: number) => {
    const currentIdx = steps.findIndex(s => s.id === currentStep);
    if (stepId === currentStep) return 'active';
    if (index < currentIdx) return 'done';
    return 'pending';
  };

  return (
    <div className="flex items-center gap-0 mb-9">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className={`flex items-center gap-2 text-xs font-semibold tracking-wide transition-colors duration-300 ${
            getStatus(step.id, idx) === 'active' ? 'text-mint' : 
            getStatus(step.id, idx) === 'done' ? 'text-teal' : 'text-muted'
          }`}>
            <div className={`w-6 h-6 rounded-full border-[1.5px] border-current flex items-center justify-center text-[11px] font-mono flex-shrink-0 transition-all duration-300 ${
              getStatus(step.id, idx) === 'active' ? 'bg-mint border-mint text-navy shadow-[0_0_15px_rgba(2,195,154,0.3)]' : 
              getStatus(step.id, idx) === 'done' ? 'bg-teal border-teal text-white' : ''
            }`}>
              {getStatus(step.id, idx) === 'done' ? <CheckCircle2 size={12} strokeWidth={3} /> : step.num}
            </div>
            {step.label}
          </div>
          {idx < steps.length - 1 && (
            <div className="flex-1 h-px bg-border mx-2 max-w-[60px]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const ScoreRing = ({ score, color }: { score: number; color: string }) => {
  const circumference = 351.86;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative w-[130px] h-[130px] flex-shrink-0">
      <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
        <circle 
          className="stroke-muted/15" 
          cx="65" cy="65" r="56" 
          fill="none" strokeWidth="8"
        />
        <motion.circle 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          cx="65" cy="65" r="56" 
          fill="none" strokeWidth="8"
          strokeDasharray={circumference}
          stroke={color}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[34px] font-bold leading-none text-white">
          {score}
        </div>
        <div className="text-[11px] color-muted font-mono uppercase tracking-tighter">/ 100</div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { icon: React.ReactNode; label: string; bg: string; color: string }> = {
    missing: { icon: <AlertCircle size={12} />, label: 'Missing', bg: 'bg-red-500/10', color: 'text-red-500' },
    partial: { icon: <AlertCircle size={12} />, label: 'Partial', bg: 'bg-yellow-500/10', color: 'text-yellow-500' },
    match: { icon: <CheckCircle2 size={12} />, label: 'Match', bg: 'bg-green-500/10', color: 'text-green-500' },
    strength: { icon: <TrendingUp size={12} />, label: 'Strength', bg: 'bg-mint/10', color: 'text-mint' },
    irrelevant: { icon: <AlertCircle size={12} />, label: 'Not Required', bg: 'bg-slate-500/10', color: 'text-slate-500' },
  };
  const s = map[status.toLowerCase()] || map.irrelevant;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${s.bg} ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
};

const PriorityChip = ({ priority }: { priority: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    critical: { bg: 'bg-red-500/15', color: 'text-red-500' },
    high: { bg: 'bg-orange-500/15', color: 'text-orange-500' },
    medium: { bg: 'bg-yellow-500/15', color: 'text-yellow-500' },
    low: { bg: 'bg-slate-500/12', color: 'text-gray' },
    strength: { bg: 'bg-green-500/12', color: 'text-green-500' },
    ignore: { bg: 'bg-slate-500/8', color: 'text-slate-500' },
  };
  const p = priority.toLowerCase();
  const s = map[p] || map.low;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-tighter ${s.bg} ${s.color}`}>
      {priority}
    </span>
  );
};

export default function App() {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resume.trim() || !jd.trim()) {
      setError('Please provide both your resume and the job description.');
      return;
    }
    if (resume.trim().length < 50) {
      setError('Resume content seems too short. Please provide the full text.');
      return;
    }

    setError(null);
    setLoading(true);
    setStep('analyse');

    try {
      const data = await analyzeMatch(resume, jd);
      setResult(data);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    setResume(`JONATHAN DOE
Software Engineer

SKILLS:
- Languages: TypeScript, Python, Java
- Frameworks: React, Next.js, Node.js, Express
- Databases: PostgreSQL, MongoDB, Redis
- Infrastructure: AWS, Docker, CI/CD pipelines

EXPERIENCE:
Full Stack Developer | CloudTech Solutions | 2021 - Present
- Built and maintained React-based dashboards reduced data latency by 40%.
- Integrated PostgreSQL with complex query optimizations.
- Deployed microservices using Docker and managed AWS Lambda functions.

Software Developer Intern | StartUp Inc | 2020 - 2021
- Contributed to mobile-first web applications using React Native.
- Automated testing suites using Jest.

EDUCATION:
B.S. in Computer Science | University of Technology | 2020`);

    setJd(`SENIOR CLOUD ENGINEER - FULL STACK

Requirements:
- 5+ years of experience in Software Development.
- Expert proficiency in React, TypeScript, and Node.js.
- Strong background in AWS Cloud Infrastructure (IAM, VPC, S3, RDS).
- Proven experience with Docker and Kubernetes for container orchestration.
- Deep understanding of SQL optimization and database design.
- Excellent communication skills and leadership experience.

Nice to have:
- Experience with GraphQL and Apollo Client.
- Contributions to open-source software.`);
    setError(null);
  };

  const resetApp = () => {
    setResult(null);
    setStep('input');
    setError(null);
  };

  const getVerdict = (score: number) => {
    if (score >= 80) return { label: '✓ Strong Match', color: '#22C55E' };
    if (score >= 60) return { label: '~ Good Match', color: '#02C39A' };
    if (score >= 40) return { label: '△ Partial Match', color: '#F9C74F' };
    return { label: '✗ Weak Match', color: '#EF4444' };
  };

  return (
    <div className="relative z-10 max-w-[1100px] mx-auto px-6 pb-20">
      <Header />
      
      <StepIndicator currentStep={step} />

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Hero Section */}
            <div className="text-center max-w-[700px] mx-auto space-y-4">
              <motion.h1 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight"
              >
                Find your perfect <span className="text-mint">career match</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray text-lg md:text-xl font-medium"
              >
                AI-driven analysis that bridges the gap between your resume and your dream job.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-6 pt-2"
              >
                <div className="flex items-center gap-2 text-xs font-mono text-muted">
                  <ShieldCheck size={14} className="text-teal" /> Privacy First
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted">
                  <Zap size={14} className="text-mint" /> Real-time Analysis
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted">
                  <CheckCircle2 size={14} className="text-teal" /> Skill Gap Detection
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-dark/70 border border-border rounded-3xl p-6 backdrop-blur-md focus-within:border-mint/40 transition-all shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[1px] text-mint">
                    <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
                    <FileText size={16} /> Resume
                  </div>
                  <span className="text-[10px] text-muted font-mono bg-navy/50 px-2 py-1 rounded">Markdown or Plaintext</span>
                </div>
                <textarea 
                  className="w-full min-h-[240px] max-h-[500px] bg-navy/60 border border-muted/20 rounded-xl p-4 text-white font-sans text-[14px] leading-relaxed resize-y focus:outline-none focus:border-mint/35 transition-colors placeholder:text-muted/50"
                  placeholder="Paste your professional experience here..."
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                />
                <div className="flex items-center justify-between mt-1">
                  <button 
                    onClick={loadSample}
                    className="text-[11px] font-bold font-mono text-teal hover:text-mint transition-colors underline underline-offset-4"
                  >
                    Load Sample Data
                  </button>
                  <div className="text-[11px] text-muted font-mono bg-navy/40 px-2 py-0.5 rounded">
                    {resume.length.toLocaleString()} characters
                  </div>
                </div>
              </div>

              <div className="bg-dark/70 border border-border rounded-3xl p-6 backdrop-blur-md focus-within:border-mint/40 transition-all shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[1px] text-mint">
                    <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
                    <Briefcase size={16} /> Job Description
                  </div>
                  <span className="text-[10px] text-muted font-mono bg-navy/50 px-2 py-1 rounded">Full JD Text</span>
                </div>
                <textarea 
                  className="w-full min-h-[240px] max-h-[500px] bg-navy/60 border border-muted/20 rounded-xl p-4 text-white font-sans text-[14px] leading-relaxed resize-y focus:outline-none focus:border-mint/35 transition-colors placeholder:text-muted/50"
                  placeholder="Paste the target job requirements here..."
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />
                <div className="text-right mt-1">
                  <span className="text-[11px] text-muted font-mono bg-navy/40 px-2 py-0.5 rounded">
                    {jd.length.toLocaleString()} characters
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 flex items-center gap-3 text-[14px] text-red-300 shadow-lg"
              >
                <AlertCircle size={18} className="flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="flex flex-col items-center gap-4 pt-4">
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="group relative bg-linear-to-r from-teal to-mint border-none rounded-2xl px-16 py-5 cursor-pointer font-mono text-[16px] font-bold text-navy tracking-tight transition-all hover:-translate-y-1 active:translate-y-0 shadow-[0_10px_30px_rgba(2,195,154,0.3)] hover:shadow-[0_15px_40px_rgba(2,195,154,0.4)] disabled:opacity-55 disabled:cursor-not-allowed flex items-center gap-3 overflow-hidden"
              >
                <Zap size={20} className="group-hover:animate-pulse" />
                Score Correlation
              </button>
              <p className="text-[11px] text-muted font-mono uppercase tracking-widest text-center max-w-[400px]">
                Analysis is powered by Gemini 3.1 Pro and may take 5-10 seconds to process.
              </p>
            </div>
          </motion.div>
        )}

        {step === 'analyse' && (
          <motion.div 
            key="analyse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <div className="relative w-20 h-20 mx-auto mb-6">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-mint"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[10px] rounded-full border-2 border-transparent border-t-teal"
              />
              <div className="absolute inset-[22px] bg-mint/10 rounded-full flex items-center justify-center text-2xl">
                🔍
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Extracting skills & entities...</h3>
            <p className="text-xs text-muted">Running Gemini NLP pipeline</p>
            <div className="flex gap-2 justify-center mt-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-border" />
              ))}
            </div>
          </motion.div>
        )}

        {step === 'results' && result && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Analysis Report</h2>
              <button 
                onClick={resetApp}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border border-border rounded-[10px] text-muted font-semibold text-[13px] hover:border-teal hover:text-teal transition-all"
              >
                <RefreshCw size={14} /> New Analysis
              </button>
            </div>

            {/* Score Hero */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-8 items-center bg-dark/80 border border-border rounded-[20px] p-8 md:px-9 backdrop-blur-md">
              <ScoreRing 
                score={result.overall_score} 
                color={getVerdict(result.overall_score).color} 
              />
              <div className="text-center sm:text-left">
                <div 
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[12px] font-bold tracking-tight mb-3.5"
                  style={{ 
                    backgroundColor: `${getVerdict(result.overall_score).color}20`, 
                    color: getVerdict(result.overall_score).color 
                  }}
                >
                  {getVerdict(result.overall_score).label}
                </div>
                <h2 className="text-[22px] font-bold mb-2 text-white leading-tight">
                  {result.headline}
                </h2>
                <p className="text-[14px] text-gray leading-relaxed max-w-[500px]">
                  {result.summary}
                </p>
              </div>
            </div>

            {/* Subscores */}
            <div className="bg-dark/60 border border-border rounded-2xl p-7 md:px-8">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.8px] text-mint mb-6 flex items-center gap-2">
                <ChevronRight size={14} /> Dimension Breakdown
              </h3>
              <div className="space-y-6">
                {(Object.entries({
                  skills: { label: 'Skills Match', icon: <Zap size={14} /> },
                  experience: { label: 'Experience Depth', icon: <TrendingUp size={14} /> },
                  education: { label: 'Education Fit', icon: <BookOpen size={14} /> },
                  certifications: { label: 'Certifications', icon: <Award size={14} /> }
                }) as [keyof typeof result.subscores, { label: string; icon: React.ReactNode }][]).map(([key, info]) => {
                  const sub = result.subscores[key];
                  const color = getVerdict(sub.score).color;
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center text-[13px]">
                        <div className="flex items-center gap-2 font-semibold text-white">
                          <span className="text-muted">{info.icon}</span>
                          {info.label}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted font-mono uppercase tracking-tighter">
                            Weight: {sub.weight}%
                          </span>
                          <span className="font-bold font-mono text-[14px]" style={{ color }}>
                            {sub.score}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted/12 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${sub.score}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                      <p className="text-[11px] text-muted mt-1 leading-relaxed">
                        {sub.note}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gap Analysis */}
            <div className="bg-dark/60 border border-border rounded-2xl p-7 md:px-8 overflow-hidden">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.8px] text-mint mb-5 flex items-center gap-2">
                <ChevronRight size={14} /> Gap Analysis
              </h3>
              <div className="overflow-x-auto -mx-7 md:-mx-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-7 md:px-8 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                        Skill / Requirement
                      </th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                        Status
                      </th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                        Priority
                      </th>
                      <th className="px-7 md:px-8 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.gaps.map((gap, i) => (
                      <tr 
                        key={i} 
                        className="border-b border-muted/5 hover:bg-mint/[0.03] transition-colors"
                      >
                        <td className="px-7 md:px-8 py-3.5 font-semibold text-white text-[13px]">
                          {gap.skill}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={gap.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <PriorityChip priority={gap.priority} />
                        </td>
                        <td className="px-7 md:px-8 py-3.5 text-[12px] text-gray leading-relaxed max-w-[300px]">
                          {gap.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-dark/60 border border-border rounded-2xl p-7 md:px-8">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.8px] text-mint mb-5 flex items-center gap-2">
                <ChevronRight size={14} /> Improvement Suggestions
              </h3>
              <div className="divide-y divide-muted/5">
                {result.suggestions.map((sug, i) => (
                  <div key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${sug.color}22` }}
                    >
                      {sug.icon === 'lightbulb' ? <Lightbulb size={20} style={{ color: sug.color }} /> : 
                       sug.icon === 'briefcase' ? <Briefcase size={20} style={{ color: sug.color }} /> :
                       sug.icon === 'check' ? <ShieldCheck size={20} style={{ color: sug.color }} /> :
                       <div className="text-xl" style={{ color: sug.color }}>{sug.icon}</div>}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[13px] font-bold text-white mb-0.5">{sug.title}</h4>
                      <p className="text-[12px] text-gray leading-relaxed">{sug.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
