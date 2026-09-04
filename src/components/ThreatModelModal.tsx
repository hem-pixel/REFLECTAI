import React from 'react';
import { X, ShieldCheck, Lock, Database, Cpu, Server, Key } from 'lucide-react';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const threatZones = [
    {
      zone: '1. Input Surfaces',
      icon: <Lock className="h-4 w-4 text-amber-600" />,
      threats: 'Prompt injection, malformed payloads, unescaped text input, command injection.',
      countermeasures:
        'Defensive null-safe JSON destructuring, character limits, strict type enforcement, and client-side sanitization before network dispatch.',
    },
    {
      zone: '2. Planning & Reasoning',
      icon: <Cpu className="h-4 w-4 text-indigo-600" />,
      threats: 'System instruction hijacking, model hallucinations, adversarial prompt evasion.',
      countermeasures:
        'Immutable server-side system instructions scoped strictly to mindful reflection, plain-text role delineation, and zero execution of model output as code.',
    },
    {
      zone: '3. Tool & API Execution',
      icon: <Server className="h-4 w-4 text-emerald-600" />,
      threats: 'API key exposure, quota exhaustion (429), model outage (503), privilege escalation.',
      countermeasures:
        'Gemini API key kept strictly server-side (zero browser leakage); 4-tier model fallback ladder (3.6 Flash -> 3.1 Flash-Lite -> Flash Latest -> 3.7 Flash) for high availability.',
    },
    {
      zone: '4. Memory & State',
      icon: <Database className="h-4 w-4 text-blue-600" />,
      threats: 'Cross-user data leakage, unauthenticated document reads/writes, NoSQL driver crash via undefined attributes.',
      countermeasures:
        'Zero insecure defaults in firestore.rules; owner-bound path checking (/users/{userId}/interactions/{id}) ensuring request.auth.uid == userId; recursive undefined-stripping prior to setDoc.',
    },
    {
      zone: '5. Inter-System Communication',
      icon: <Key className="h-4 w-4 text-purple-600" />,
      threats: 'Credential sniffing, credential theft, token forgery, insecure transport.',
      countermeasures:
        'Federated Google OAuth Identity via Firebase Authentication; token lifecycle handled by Firebase SDK; zero custom password storage or exposure.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#282220]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#fcf9f4] p-6 shadow-xl border border-[#e2d7cb]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e2d7cb]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#f2ebe1] text-[#9b4d36] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#282220]">
                Agentic Threat Model & Security Controls
              </h3>
              <p className="text-xs text-[#6e6259]">
                Architectural defense breakdown across the 5 Core Threat Zones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6e6259] hover:text-[#282220] hover:bg-[#f2ebe1] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Threat Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e2d7cb] bg-[#f2ebe1] text-[#282220]">
                <th className="py-2.5 px-3 font-semibold w-44">Threat Zone</th>
                <th className="py-2.5 px-3 font-semibold">Identified Risk Vectors</th>
                <th className="py-2.5 px-3 font-semibold">Implemented Countermeasures</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2d7cb] text-[#6e6259]">
              {threatZones.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#f2ebe1]/50 transition-colors">
                  <td className="py-3 px-3 font-medium text-[#282220] flex items-center gap-2">
                    {item.icon}
                    <span>{item.zone}</span>
                  </td>
                  <td className="py-3 px-3">{item.threats}</td>
                  <td className="py-3 px-3 text-[#282220] bg-[#f2ebe1]/80 rounded-sm">
                    {item.countermeasures}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Firestore Rules Verification */}
        <div className="mt-4 rounded-xl bg-[#282220] p-3 text-[#fcf9f4] text-xs font-mono">
          <div className="flex items-center justify-between text-[#a89d94] text-[11px] mb-1">
            <span>firestore.rules (Owner-Bound User Isolation)</span>
            <span className="text-[#b8dab8]">Deployed & Active</span>
          </div>
          <pre className="overflow-x-auto text-[11px] leading-snug text-[#f2ebe1]">
{`match /users/{userId}/interactions/{interactionId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}`}
          </pre>
        </div>

        {/* Modal Close CTA */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#9b4d36] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#833e2a] transition-colors cursor-pointer"
          >
            Close Security Review
          </button>
        </div>
      </div>
    </div>
  );
};
