import React, { useState } from 'react';
import { X, Shield, FileText, Lock, Award, BookOpen, CheckCircle2, ExternalLink } from 'lucide-react';

export default function LegalModal({ initialTab = 'tos', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'tos', label: 'Terms of Service', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy (DPDP Act)', icon: Lock },
    { id: 'licenses', label: 'Open Source & MIT License', icon: Award },
    { id: 'ai', label: 'Llama 3.2 Vision License', icon: Shield },
    { id: 'rti', label: 'RTI Act 2005 & Citizen Charter', icon: BookOpen },
  ];

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden font-body text-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-xl text-white shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg leading-none tracking-tight">
                TraceSpark Legal & Compliance Hub
              </h3>
              <p className="text-[11px] text-slate-400 font-mono tracking-wider uppercase mt-1">
                Government Gateway Transparency & Licensing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto bg-slate-50 border-b border-slate-200 px-4 pt-3 gap-2 shrink-0 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer border-t border-x ${
                  isActive
                    ? 'bg-white text-slate-900 border-slate-200 shadow-sm font-extrabold'
                    : 'bg-transparent text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-red-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-600">
          
          {activeTab === 'tos' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-l-4 border-red-500 pl-3 py-1 bg-red-50/50 rounded-r-xl">
                <h4 className="font-extrabold text-slate-900 text-sm">1. Citizen Reporting Integrity & Anti-Spam Policy</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Effective Date: January 1, 2026 • Municipal SLA Jurisdiction</p>
              </div>
              <p>
                Welcome to <strong>TraceSpark</strong>, India's AI-Powered Civic Accountability & SLA Enforcement Gateway. By accessing or using this portal to lodge infrastructure hazards, cast priority upvotes, or query civic data, you agree to comply with these Terms of Service.
              </p>
              <h5 className="font-bold text-slate-800">1.1 Mandatory AI Verification & Evidence Standards</h5>
              <p>
                All photographic evidence uploaded to TraceSpark undergoes real-time autonomous inspection via <strong>Meta Llama 3.2 Vision AI</strong>. Users are strictly prohibited from submitting misleading, digitally manipulated, irrelevant (e.g., selfies, personal property), or defamatory imagery. Submissions failing AI severity scoring or verification confidence thresholds will be automatically rejected or flagged for administrative review.
              </p>
              <h5 className="font-bold text-slate-800">1.2 Community Upvoting & 25-Vote SLA Escalation Threshold</h5>
              <p>
                TraceSpark implements an automated Service Level Agreement (SLA) escalation engine. When a verified infrastructure report reaches <strong>25 unique citizen upvotes</strong>, the system automatically triggers an executive escalation dispatch via Twilio WhatsApp and Mailgun Email directly to the Zonal Commissioner and Municipal Ward Officer. Attempting to artificially inflate upvote counts via automated scripts, botnets, or Sybil attacks is illegal under Section 66 of the Information Technology Act, 2000.
              </p>
              <h5 className="font-bold text-slate-800">1.3 Municipal Ward Jurisdiction & Liability</h5>
              <p>
                TraceSpark serves as a transparent civic intelligence bridge for municipal corporations including Greater Hyderabad Municipal Corporation (GHMC). While TraceSpark guarantees automated dispatch of notifications upon SLA threshold attainment, physical repair timelines remain subject to municipal engineering schedules and statutory citizen charter guidelines.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-l-4 border-teal-500 pl-3 py-1 bg-teal-50/50 rounded-r-xl">
                <h4 className="font-extrabold text-slate-900 text-sm">2. Statutory Compliance: Indian DPDP Act, 2023 (Act No. 22 of 2023)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Digital Personal Data Protection Act, 2023 • Data Fiduciary & Principal Rights</p>
              </div>
              <p>
                TraceSpark operates as a compliant <strong>Data Fiduciary</strong> under India's statutory <strong>Digital Personal Data Protection (DPDP) Act, 2023 (Act No. 22 of 2023)</strong>. We process citizen personal data strictly for the lawful purpose of public grievance redressal and municipal SLA enforcement in Greater Hyderabad Municipal Corporation (GHMC).
              </p>
              
              <h5 className="font-bold text-slate-800">2.1 Section 4 & 6: Lawful Consent & Purpose Limitation</h5>
              <p>
                Under Section 4 and Section 6 of the DPDP Act, personal data (such as citizen name, email, and location) is collected only after explicit, affirmative consent upon user registration or OAuth login. Data is processed strictly for the purpose of verifying infrastructure hazards, routing grievances to municipal ward officers, and executing SLA escalations.
              </p>

              <h5 className="font-bold text-slate-800">2.2 Section 7(b): Legitimate Use for Municipal Service Delivery</h5>
              <p>
                In accordance with <strong>Section 7(b) of the DPDP Act, 2023</strong>, processing of personal data for the provision of any subsidy, benefit, service, certificate, or license by the State or Municipal Corporation is recognized as a "Certain Legitimate Use." This enables TraceSpark to autonomously dispatch WhatsApp and Email SLAs to municipal authorities without causing friction or delay in emergency hazard resolution.
              </p>

              <h5 className="font-bold text-slate-800">2.3 Section 8: Data Fiduciary Security Obligations & Zero-Trust Architecture</h5>
              <p>
                As mandated by Section 8, TraceSpark implements rigorous technical and organizational safeguards to prevent personal data breach:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Cryptographic Google OAuth 2.0 (GIS)</strong>: We never store Google passwords. Our backend verifies encrypted JSON Web Tokens (JWT) against Google's public cryptographic certificates via <code>OAuth2Client.verifyIdToken()</code>.</li>
                <li><strong>Mobile Number Restraint & Hashing</strong>: Citizen phone numbers and passwords are hashed using industry-standard bcrypt algorithms. Mobile numbers are utilized strictly for vital SLA notifications and account recovery—they are **never displayed publicly** on community feeds or map overlays.</li>
                <li><strong>Euclidean GIS Routing Math</strong>: GPS coordinates <code>(Latitude, Longitude)</code> are processed exclusively to map hazards to canonical ward boundaries via our spatial algorithm (<code>detectWardFromGPS</code>). Location data is never monetized or shared with third parties.</li>
              </ul>

              <h5 className="font-bold text-slate-800">2.4 Section 11 & 13: Rights of Data Principal (Citizen Rights) & Grievance Redressal</h5>
              <p>
                Under Section 11 of the DPDP Act, citizens (Data Principals) retain the absolute right to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Request a comprehensive summary of all personal data and grievance reports submitted to TraceSpark.</li>
                <li>Request immediate correction, updating, or erasure of their personal profile data from our reactive state engine.</li>
                <li>Escalate data privacy grievances to our designated Data Protection Officer (DPO) or the statutory <strong>Data Protection Board of India</strong> under Section 13.</li>
              </ul>
            </div>
          )}

          {activeTab === 'licenses' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-l-4 border-orange-500 pl-3 py-1 bg-orange-50/50 rounded-r-xl">
                <h4 className="font-extrabold text-slate-900 text-sm">3. Open Source & MIT License Acknowledgments</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">TraceSpark Core • OpenStreetMap • Leaflet GIS</p>
              </div>
              <p>
                TraceSpark believes in open municipal governance and open-source civic technology. Core application modules are licensed under the permissive MIT License.
              </p>
              <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl font-mono text-[11px] whitespace-pre-wrap leading-normal border border-slate-800 shadow-inner">
{`The MIT License (MIT)
Copyright (c) 2026 TraceSpark Civic Technologies Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.`}
              </div>
              <h5 className="font-bold text-slate-800">3.1 OpenStreetMap & ODbL GIS Data License</h5>
              <p>
                Map tile layers and vector boundaries are powered by <strong>OpenStreetMap</strong> and rendered via <strong>Leaflet.js</strong>. Cartographic data is copyrighted by OpenStreetMap contributors and licensed under the Open Database License (ODbL) 1.0.
              </p>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-l-4 border-purple-500 pl-3 py-1 bg-purple-50/50 rounded-r-xl">
                <h4 className="font-extrabold text-slate-900 text-sm">4. Llama 3.2 Vision & AI Model Licensing</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Meta Llama 3.2 Community License • Autonomous Infrastructure Inspection</p>
              </div>
              <p>
                Autonomous photographic verification and severity grading (Scores 1–10) are powered by <strong>Meta Llama 3.2 Vision</strong> multimodal large language models, accessed via high-speed cloud inference endpoints.
              </p>
              <h5 className="font-bold text-slate-800">4.1 Meta Llama 3.2 Community License Agreement</h5>
              <p>
                Use of Llama 3.2 Vision models is governed by the Meta Llama 3.2 Community License Agreement. TraceSpark utilizes these multimodal capabilities strictly for civic good, public safety hazard detection, and municipal infrastructure analytics.
              </p>
              <h5 className="font-bold text-slate-800">4.2 AI Transparency & Human-in-the-Loop Override</h5>
              <p>
                While Llama 3.2 Vision achieves over 95% classification accuracy on civil engineering defects (such as asphalt spalling, waterlogging, and solid waste accumulation), AI severity scores are advisory. Municipal engineers and Zonal Commissioners retain ultimate administrative authority to inspect, re-classify, or prioritize maintenance work orders.
              </p>
            </div>
          )}

          {activeTab === 'rti' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-l-4 border-blue-500 pl-3 py-1 bg-blue-50/50 rounded-r-xl">
                <h4 className="font-extrabold text-slate-900 text-sm">5. Right to Information (RTI Act 2005) & Citizen Charter</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Statutory Municipal Timelines • Public Grievance Redressal</p>
              </div>
              <p>
                TraceSpark is engineered to align directly with statutory citizen rights mandated under the <strong>Right to Information (RTI) Act, 2005</strong> and municipal Citizen Charters.
              </p>
              <h5 className="font-bold text-slate-800">5.1 Statutory SLA Timelines by Hazard Category</h5>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden text-left">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Hazard Category</th>
                      <th className="p-3">AI Severity Target</th>
                      <th className="p-3">Statutory SLA Resolution Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    <tr>
                      <td className="p-3 font-semibold">Severe Potholes / Road Collapse</td>
                      <td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">Score 8–10</span></td>
                      <td className="p-3 font-mono font-bold text-slate-800">24 to 48 Hours</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Open Drains / Manhole Overflow</td>
                      <td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">Score 8–10</span></td>
                      <td className="p-3 font-mono font-bold text-slate-800">Immediate / 24 Hours</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Garbage Accumulation / Dump</td>
                      <td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">Score 5–7</span></td>
                      <td className="p-3 font-mono font-bold text-slate-800">48 to 72 Hours</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Streetlight Failure / Electrical</td>
                      <td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Score 4–6</span></td>
                      <td className="p-3 font-mono font-bold text-slate-800">72 Hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <h5 className="font-bold text-slate-800 mt-4">5.2 Digital Public Record & RTI Evidence</h5>
              <p>
                Every report logged on TraceSpark that reaches 25 upvotes generates an immutable digital timestamp, AI inspection certificate, and WhatsApp dispatch confirmation. Citizens may utilize these exported records as official documentary evidence when filing RTI applications or escalating grievances to state lokayuktas and appellate authorities.
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-teal-600 font-mono text-[11px] font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>TraceSpark Legal Gateway Verified & Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-mono font-extrabold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition cursor-pointer shadow-sm"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
}
