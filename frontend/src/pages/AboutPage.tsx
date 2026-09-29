import React from 'react';
import {
  ShieldAlert,
  Cpu,
  Layers,
  CheckCircle,
  FileText,
  Building,
  Terminal,
  Server,
  Zap,
  Lock,
} from 'lucide-react';

interface ThirdPartyLicense {
  name: string;
  version: string;
  ecosystem: 'Backend (Python)' | 'Frontend (TypeScript)';
  license: string;
  purpose: string;
}

const THIRD_PARTY_LIBRARIES: ThirdPartyLicense[] = [
  { name: 'FastAPI', version: '>=0.115.0', ecosystem: 'Backend (Python)', license: 'MIT', purpose: 'High-performance asynchronous REST API framework' },
  { name: 'Uvicorn', version: '>=0.30.0', ecosystem: 'Backend (Python)', license: 'BSD-3-Clause', purpose: 'Lightning-fast ASGI server implementation' },
  { name: 'Pydantic', version: '>=2.8.0', ecosystem: 'Backend (Python)', license: 'MIT', purpose: 'Data validation and serialization using Python type hints' },
  { name: 'SQLAlchemy', version: '>=2.0.30', ecosystem: 'Backend (Python)', license: 'MIT', purpose: 'Enterprise Relational ORM and database engine' },
  { name: 'Alembic', version: '>=1.13.0', ecosystem: 'Backend (Python)', license: 'MIT', purpose: 'Database schema migration and version control' },
  { name: 'scikit-learn', version: '>=1.5.0', ecosystem: 'Backend (Python)', license: 'BSD-3-Clause', purpose: 'RandomForest anomaly classification ML engine' },
  { name: 'NumPy', version: '>=1.26.0', ecosystem: 'Backend (Python)', license: 'BSD-3-Clause', purpose: 'Vectorized mathematical and spectral FFT operations' },
  { name: 'psycopg', version: '3.x', ecosystem: 'Backend (Python)', license: 'LGPL-3.0', purpose: 'PostgreSQL binary database adapter' },
  { name: 'python-jose', version: '>=3.3.0', ecosystem: 'Backend (Python)', license: 'MIT', purpose: 'JWT cryptographic signing and verification' },
  { name: 'passlib / bcrypt', version: '>=1.7.4', ecosystem: 'Backend (Python)', license: 'BSD / Apache-2.0', purpose: 'Secure salted password hashing' },
  { name: 'websockets', version: '>=12.0', ecosystem: 'Backend (Python)', license: 'BSD-3-Clause', purpose: 'Low-latency duplex WebSocket communications' },
  { name: 'pytest / pytest-asyncio', version: '>=8.0.0', ecosystem: 'Backend (Python)', license: 'MIT / Apache-2.0', purpose: 'Automated test execution and assertion framework' },
  { name: 'React', version: '19.2.8', ecosystem: 'Frontend (TypeScript)', license: 'MIT', purpose: 'Declarative component-based user interface' },
  { name: 'TypeScript', version: '~6.0.2', ecosystem: 'Frontend (TypeScript)', license: 'Apache-2.0', purpose: 'Strict static type checking and type inference' },
  { name: 'Vite', version: '>=8.3.0', ecosystem: 'Frontend (TypeScript)', license: 'MIT', purpose: 'Next-generation frontend tooling and bundler' },
  { name: 'Tailwind CSS', version: '>=4.3.3', ecosystem: 'Frontend (TypeScript)', license: 'MIT', purpose: 'Utility-first modern styling framework' },
  { name: 'Lucide React', version: '>=1.48.0', ecosystem: 'Frontend (TypeScript)', license: 'ISC', purpose: 'Industrial iconography system' },
];

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                System Overview & Credits
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-xs text-gray-500 font-medium">B2B Industrial Platform</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Aperture AIoT Control Center
            </h1>
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 pt-0.5">
              <Building className="w-4 h-4 text-blue-600" />
              Developed for: <span className="text-blue-700 font-bold">Aperture Venture Studio</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-gray-500 font-medium">System Domain</div>
              <div className="text-xs font-bold text-gray-900">Automotive Assembly Tool Monitoring</div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-right">
              <div className="text-[11px] text-gray-500 font-medium">Architecture</div>
              <div className="text-xs font-bold text-emerald-600">Deterministic Control</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Safety Notice / Disclaimer Banner (PRD Section 40) */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs text-amber-950">
            <div className="font-bold text-sm tracking-tight text-amber-900 uppercase">
              Important Safety & Functional Certification Notice
            </div>
            <p className="leading-relaxed">
              This software is a monitoring/control demonstration and must not be represented as a certified
              functional-safety controller without appropriate engineering validation, hardware implementation,
              testing, and certification.
            </p>
            <div className="text-[11px] text-amber-800 font-medium pt-1">
              Deterministic safety interlocks and closed-loop tachometer verification are strictly separated from AI inference paths to prevent unverified model outputs from directly modifying physical drive outputs.
            </div>
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600">
            <Zap className="w-4 h-4" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">AI Inference Engine</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Multi-class anomaly & disturbance detection (`NORMAL`, `MILD_DISTURBANCE`, `STRONG_DISTURBANCE`) evaluated from high-frequency triaxial BLE vibration features.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Layers className="w-4 h-4" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Deterministic Policy</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Configurable persistence windows, hard safety limits, and staleness watchdogs. Translates inference scores into audited equipment actions (`CONTINUE`, `REDUCE_SPEED`, `STOP`).
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-600">
            <Lock className="w-4 h-4" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Latched Safety Machine</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            `LATCHED_STOP` blocks all automatic restarts following trips. Requires explicit authenticated operator inspection and acknowledgement before reset.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <Cpu className="w-4 h-4" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Tachometer Feedback</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Closed-loop physical verification. Evaluates actual measured RPM against target set-speeds to guarantee physical motor adherence before marking commands complete.
          </p>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">Technology Stack Specification</h2>
          </div>
          <span className="text-[11px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded border">
            Full-Stack Dockerized
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-[11px] font-bold text-gray-500 uppercase">Runtime</div>
            <div className="text-xs font-bold text-gray-900 mt-1">Python 3.12</div>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-[11px] font-bold text-gray-500 uppercase">Backend</div>
            <div className="text-xs font-bold text-gray-900 mt-1">FastAPI</div>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-[11px] font-bold text-gray-500 uppercase">Frontend</div>
            <div className="text-xs font-bold text-gray-900 mt-1">React 19</div>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-[11px] font-bold text-gray-500 uppercase">Language</div>
            <div className="text-xs font-bold text-gray-900 mt-1">TypeScript</div>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-[11px] font-bold text-gray-500 uppercase">Database</div>
            <div className="text-xs font-bold text-gray-900 mt-1">PostgreSQL 16</div>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-[11px] font-bold text-gray-500 uppercase">Caching & PubSub</div>
            <div className="text-xs font-bold text-gray-900 mt-1">Redis 7</div>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-[11px] font-bold text-gray-500 uppercase">ML Model</div>
            <div className="text-xs font-bold text-gray-900 mt-1">scikit-learn</div>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-[11px] font-bold text-gray-500 uppercase">Containerization</div>
            <div className="text-xs font-bold text-gray-900 mt-1">Docker Compose</div>
          </div>
        </div>
      </div>

      {/* Third-Party Licenses Section (PRD Section 40) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">Third-Party Open Source Licenses</h2>
          </div>
          <span className="text-[11px] text-gray-500">
            {THIRD_PARTY_LIBRARIES.length} Installed Dependencies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Component</th>
                <th className="py-2.5 px-4">Version</th>
                <th className="py-2.5 px-4">Ecosystem</th>
                <th className="py-2.5 px-4">License</th>
                <th className="py-2.5 px-4">Purpose / Role in Architecture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {THIRD_PARTY_LIBRARIES.map((lib, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-gray-900 font-mono text-[11px]">{lib.name}</td>
                  <td className="py-2.5 px-4 font-mono text-gray-500 text-[11px]">{lib.version}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                        lib.ecosystem.includes('Backend')
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {lib.ecosystem}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                      {lib.license}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-600">{lib.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
