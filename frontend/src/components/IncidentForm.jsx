import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Globe, Landmark, MapPin, Send, CheckCircle2, Loader2, Search, Tag, Radar, Sparkles, BellRing, Paperclip } from 'lucide-react';
import { createIncident } from '../services/api.js';

const PLACEHOLDERS = [
  "Report incident here...",
  "यहाँ घटना दर्ज करें...",
  "Reportar incidente aquí...",
  "Signaler un incident ici...",
  "Melde Vorfall hier...",
  "Transfer incident here...",
  "사건을 여기에 보고...",
  "இங்கே சம்பவத்தை புகாரளிக்கவும்...",
  "在此处报告事件...",
  "Taarifa tukio hapa...",
  "घटना येथे नोंदवा...",
  "ಘಟನೆಯನ್ನು ಇಲ್ಲಿ ವರದಿ ಮಾಡಿ...",
  "یہاں واقعہ رپورٹ کریں...",
  "Rapporteer incident hier...",
  "സംഭവം ഇവിടെ റിപ്പോർട്ട് ചെയ്യുക...",
  "أبلغ عن الحادثة هنا...",
  "Informe o incidente aqui..."
];

const AGENT_STEPS = [
  { label: "Analyzing report intake and matching stadium...", icon: Search },
  { label: "Classifying incident severity...", icon: Tag },
  { label: "Retrieving local operational context...", icon: Radar },
  { label: "Generating action recommendations...", icon: Sparkles },
  { label: "Compiling operations team notification...", icon: BellRing }
];

function detectScriptLanguage(text) {
  if (!text || !text.trim()) return null;

  const devanagari = /[\u0900-\u097F]/;
  const arabicUrdu = /[\u0600-\u06FF]/;
  const tamil = /[\u0B80-\u0BFF]/;
  const kannada = /[\u0C80-\u0CFF]/;
  const malayalam = /[\u0D00-\u0D7F]/;
  const japanese = /[\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF]/;
  const korean = /[\uAC00-\uD7AF\u1100-\u11FF]/;
  const chinese = /[\u4E00-\u9FFF]/;

  if (devanagari.test(text)) {
    if (text.includes("आहे") || text.includes("करणे") || text.includes("झाली") || text.includes("जवळ")) {
      return { lang: 'Marathi', label: 'MR', confidence: 'high' };
    }
    return { lang: 'Hindi', label: 'HI', confidence: 'high' };
  }
  if (arabicUrdu.test(text)) {
    if (text.includes("ہے") || text.includes("تھا") || text.includes("کیا")) {
      return { lang: 'Urdu', label: 'UR', confidence: 'high' };
    }
    return { lang: 'Arabic', label: 'AR', confidence: 'high' };
  }
  if (tamil.test(text)) {
    return { lang: 'Tamil', label: 'TA', confidence: 'high' };
  }
  if (kannada.test(text)) {
    return { lang: 'Kannada', label: 'KN', confidence: 'high' };
  }
  if (malayalam.test(text)) {
    return { lang: 'Malayalam', label: 'ML', confidence: 'high' };
  }
  if (japanese.test(text)) {
    return { lang: 'Japanese', label: 'JA', confidence: 'high' };
  }
  if (korean.test(text)) {
    return { lang: 'Korean', label: 'KO', confidence: 'high' };
  }
  if (chinese.test(text)) {
    return { lang: 'Chinese (Mandarin)', label: 'ZH', confidence: 'high' };
  }

  const textLower = text.toLowerCase();
  if (/\b(el|la|los|que|y|en|un|una|del|es)\b/.test(textLower)) {
    return { lang: 'Spanish', label: 'ES', confidence: 'high' };
  }
  if (/\b(le|la|les|que|et|dans|un|une|est)\b/.test(textLower)) {
    return { lang: 'French', label: 'FR', confidence: 'high' };
  }
  if (/\b(o|a|os|as|que|e|em|um|uma|do|da|é)\b/.test(textLower)) {
    return { lang: 'Portuguese', label: 'PT', confidence: 'high' };
  }
  if (/\b(der|die|das|und|ist|in|ein|eine|von|mit)\b/.test(textLower)) {
    return { lang: 'German', label: 'DE', confidence: 'high' };
  }
  if (/\b(de|het|een|en|is|in|van|op|met)\b/.test(textLower)) {
    return { lang: 'Dutch', label: 'NL', confidence: 'high' };
  }
  if (/\b(kuna|ni|na|katika|ya|wa|kwa|ni)\b/.test(textLower)) {
    return { lang: 'Swahili', label: 'SW', confidence: 'high' };
  }

  return null;
}

export default function IncidentForm({ stadiums, onIncidentCreated }) {
  const [description, setDescription] = useState('');
  const [stadiumName, setStadiumName] = useState('');
  const [zoneLocation, setZoneLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [agentStep, setAgentStep] = useState(0);
  const [detectedLang, setDetectedLang] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Cycle placeholders
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Detect script language on text changes
  useEffect(() => {
    const detected = detectScriptLanguage(description);
    setDetectedLang(detected);
  }, [description]);

  // Cycle agent steps during submission
  useEffect(() => {
    let timer = null;
    if (isSubmitting) {
      setAgentStep(0);
      timer = setInterval(() => {
        setAgentStep((prev) => (prev < 4 ? prev + 1 : 4));
      }, 4000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSubmitting]);

  // Auto-dismiss success banner after 8 seconds
  useEffect(() => {
    let timer = null;
    if (submitSuccess) {
      timer = setTimeout(() => {
        setSubmitSuccess(null);
      }, 8000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [submitSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setSubmitError("Please provide an incident description.");
      return;
    }
    if (!stadiumName) {
      setSubmitError("Please select a FIFA 2026 Stadium.");
      return;
    }
    if (!zoneLocation.trim()) {
      setSubmitError("Please specify the zone or location inside the stadium.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(null);

    const result = await createIncident({
      description: description.trim(),
      stadiumName,
      zoneLocation: zoneLocation.trim()
    });

    if (result.success) {
      setSubmitSuccess(result.incident);
      setDescription('');
      setZoneLocation('');
      setAttachedFiles([]);
      if (onIncidentCreated) {
        onIncidentCreated(result.incident);
      }
    } else {
      setSubmitError(result.error || "An unexpected error occurred during dispatch.");
    }
    setIsSubmitting(false);
  };

  const severityGlow = {
    critical: 'var(--critical)',
    high: 'var(--high)',
    medium: 'var(--medium)',
    low: 'var(--low)'
  };

  return (
    <section className="relative overflow-hidden select-none flex flex-col justify-between h-full" style={{ minHeight: '420px' }} aria-labelledby="form-title">
      <style>{`
        @keyframes bannerPop {
          from { opacity: 0; transform: scale(0.97) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes stepPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124, 92, 255, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(124, 92, 255, 0); }
        }
        @keyframes checkPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes langBadgeIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <div>
        <h2 id="form-title" className="text-white mb-1.5 flex items-center gap-2.5 font-semibold" style={{ fontSize: 'var(--section-title-size)' }}>
          <AlertCircle size={18} className="text-[var(--critical)]" /> 
          <span>Report Intake Dispatch</span>
        </h2>
        <p className="text-[var(--text-muted)] mb-6 font-medium" style={{ fontSize: 'var(--caption-size)', lineHeight: '1.5' }}>
          Submit reports in any localized language. Automated context translation and priority routing will execute immediately.
        </p>

        {submitError && (
          <div className="mb-5 p-3.5 bg-[var(--critical)]/10 border border-[var(--critical)]/20 text-[var(--critical)] rounded-lg font-semibold flex items-center gap-2" style={{ fontSize: 'var(--caption-size)', animation: 'bannerPop 0.25s ease' }} aria-live="assertive">
            <AlertCircle size={14} />
            <span>{submitError}</span>
          </div>
        )}

        {submitSuccess && (
          <div
            className="mb-5 p-4 bg-[var(--low)]/10 border rounded-xl font-semibold flex flex-col gap-2.5 relative overflow-hidden"
            style={{
              fontSize: 'var(--caption-size)',
              borderColor: 'var(--low)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
              animation: 'bannerPop 0.35s ease'
            }}
            aria-live="polite"
          >
            <div className="flex items-center gap-1.5 text-[var(--low)]">
              <CheckCircle2 size={15} style={{ animation: 'checkPop 0.4s ease' }} />
              <span>
                Report processed successfully:{' '}
                <strong className="capitalize">{submitSuccess.type}</strong> severity level:{' '}
                <strong
                  className="uppercase px-1.5 py-0.5 rounded"
                  style={{
                    color: severityGlow[submitSuccess.severity] || 'var(--low)',
                    background: (severityGlow[submitSuccess.severity] || 'var(--low)') + '1a'
                  }}
                >
                  {submitSuccess.severity}
                </strong>
              </span>
            </div>
            <Link
              to={`/incidents/${submitSuccess._id}`}
              className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-bold w-fit"
            >
              View Dispatch Details →
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Textarea description */}
          <div>
            <label htmlFor="incident-desc" className="block font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2" style={{ fontSize: 'var(--caption-size)' }}>
              Incident Description
            </label>
            <div className="relative">
              <textarea
                id="incident-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={PLACEHOLDERS[placeholderIndex]}
                className="w-full bg-[var(--bg-primary)] border rounded-xl p-3 text-[var(--body-size)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all duration-200 resize-none leading-relaxed"
                style={{
                  borderColor: detectedLang ? 'var(--low)' : 'rgba(255,255,255,0.15)',
                  boxShadow: detectedLang ? '0 0 0 1px rgba(52, 211, 153, 0.25)' : 'none'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)'; }}
                onBlur={(e) => { e.target.style.borderColor = detectedLang ? 'var(--low)' : 'rgba(255,255,255,0.15)'; e.target.style.boxShadow = detectedLang ? '0 0 0 1px rgba(52, 211, 153, 0.25)' : 'none'; }}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="mt-2 min-h-[18px]">
              {detectedLang ? (
                <span
                  key={detectedLang.label}
                  className="font-semibold inline-flex items-center gap-1.5 text-[var(--low)] px-2 py-0.5 rounded-full"
                  style={{ fontSize: 'var(--caption-size)', background: 'rgba(52, 211, 153, 0.1)', animation: 'langBadgeIn 0.25s ease' }}
                >
                  <Globe size={12} />
                  <span>[{detectedLang.label}] {detectedLang.lang} detected — auto-translating narrative</span>
                </span>
              ) : (
                <span className="font-medium flex items-center gap-1.5 text-[var(--text-muted)]" style={{ fontSize: 'var(--caption-size)' }}>
                  <Globe size={12} />
                  <span>Multi-lingual intake processing active (17 languages)</span>
                </span>
              )}
            </div>
          </div>

          {/* Stadium select & zone inputs */}
          <div className="space-y-4">
            <div>
              <label htmlFor="stadium-select" className="block font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2" style={{ fontSize: 'var(--caption-size)' }}>
                Stadium Venue
              </label>
              <div className="relative">
                <Landmark size={14} className="absolute left-3 top-3 text-[var(--text-muted)]" />
                <select
                  id="stadium-select"
                  value={stadiumName}
                  onChange={(e) => setStadiumName(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.15)] rounded-xl p-2.5 pl-9 text-[var(--body-size)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all appearance-none cursor-pointer"
                  disabled={isSubmitting}
                  required
                >
                  <option value="" style={{ background: '#151B2E', color: '#fff' }}>Select FIFA 2026 Stadium...</option>
                  {stadiums.map((stadium, i) => (
                    <option key={i} value={stadium.name} style={{ background: '#151B2E', color: '#fff' }}>
                      {stadium.name} — {stadium.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="zone-input" className="block font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2" style={{ fontSize: 'var(--caption-size)' }}>
                Zone / Location Inside Venue
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3.5 text-[var(--text-muted)]" />
                <input
                  id="zone-input"
                  type="text"
                  value={zoneLocation}
                  onChange={(e) => setZoneLocation(e.target.value)}
                  placeholder="e.g. Gate 4, Concourse Section 12"
                  className="w-full bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.15)] rounded-xl p-2.5 pl-9 text-[var(--body-size)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2" style={{ fontSize: 'var(--caption-size)' }}>
                Supporting Evidence / Attachments (Optional)
              </label>
              <div 
                onClick={() => {
                  if (isSubmitting) return;
                  const mockNames = ['cctv_log_gate4.mp4', 'stadium_telemetry.json', 'crowd_density_snapshot.png', 'first_responder_note.txt'];
                  const nextFile = mockNames[attachedFiles.length % mockNames.length];
                  if (!attachedFiles.includes(nextFile)) {
                    setAttachedFiles([...attachedFiles, nextFile]);
                  }
                }}
                className="w-full bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.15)] border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-[var(--accent)] transition-all flex flex-col items-center justify-center gap-1.5"
              >
                <Paperclip size={16} className="text-[var(--text-muted)]" />
                <span className="text-[var(--body-size)] text-[var(--text-secondary)] font-semibold">
                  Drag & drop files or click to attach evidence
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  Supports MP4, PNG, JPG, JSON, PDF (Max 10MB)
                </span>
              </div>
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachedFiles.map((file, fIdx) => (
                    <span 
                      key={fIdx}
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-[rgba(255,255,255,0.05)] border border-[var(--border)] text-[var(--text-secondary)] px-2.5 py-1 rounded-lg"
                    >
                      <Paperclip size={10} />
                      <span>{file}</span>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachedFiles(attachedFiles.filter((_, i) => i !== fIdx));
                        }}
                        className="text-[var(--text-muted)] hover:text-white border-none bg-transparent cursor-pointer font-bold leading-none p-0"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Progress State / Button */}
          <div className="pt-2">
            {isSubmitting ? (
              <div
                className="space-y-3 p-3.5 rounded-xl border"
                style={{ borderColor: 'rgba(124, 92, 255, 0.25)', background: 'rgba(124, 92, 255, 0.06)' }}
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2" style={{ fontSize: 'var(--caption-size)' }}>
                  <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                  <span>{AGENT_STEPS[agentStep].label}</span>
                </div>

                {/* Step tracker */}
                <div className="flex items-center gap-1.5">
                  {AGENT_STEPS.map((step, i) => {
                    const StepIcon = step.icon;
                    const done = i < agentStep;
                    const active = i === agentStep;
                    return (
                      <React.Fragment key={i}>
                        <div
                          className="flex items-center justify-center rounded-full transition-all duration-300"
                          style={{
                            width: '22px',
                            height: '22px',
                            flexShrink: 0,
                            background: done ? 'var(--accent)' : active ? 'rgba(124, 92, 255, 0.15)' : 'var(--bg-primary)',
                            border: `1px solid ${done || active ? 'var(--accent)' : 'var(--border)'}`,
                            animation: active ? 'stepPulse 1.6s ease-in-out infinite' : 'none'
                          }}
                        >
                          {done ? (
                            <CheckCircle2 size={12} color="#fff" />
                          ) : (
                            <StepIcon size={11} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                          )}
                        </div>
                        {i < AGENT_STEPS.length - 1 && (
                          <div
                            className="flex-1 h-[2px] rounded-full transition-all duration-500"
                            style={{ background: done ? 'var(--accent)' : 'var(--border)' }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full h-[46px] text-white font-bold rounded-xl cursor-pointer transition-all select-none flex items-center justify-center gap-2 active:scale-[0.98] shadow-md bg-[var(--accent)] hover:bg-indigo-600 transition-colors duration-150"
                style={{
                  fontSize: 'var(--body-size)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <Send size={14} />
                <span>Submit Intake Dispatch</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}