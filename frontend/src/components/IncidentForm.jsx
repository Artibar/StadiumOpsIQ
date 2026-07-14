import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Globe, Landmark, MapPin, Send, CheckCircle2, Loader2 } from 'lucide-react';
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
  "Analyzing report intake and matching stadium...",
  "Classifying incident severity...",
  "Retrieving local operational context...",
  "Generating action recommendations...",
  "Compiling operations team notification..."
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
      if (onIncidentCreated) {
        onIncidentCreated(result.incident);
      }
    } else {
      setSubmitError(result.error || "An unexpected error occurred during dispatch.");
    }
    setIsSubmitting(false);
  };

  return (
    <section className="relative overflow-hidden select-none flex flex-col justify-between h-full" style={{ minHeight: '420px' }} aria-labelledby="form-title">
      <div>
        <h2 id="form-title" className="text-white mb-1.5 flex items-center gap-2.5 font-bold" style={{ fontSize: '20px' }}>
          <AlertCircle size={20} className="text-[var(--critical)]" /> 
          <span>Report Intake Dispatch</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-6 font-medium">
          Submit reports in any localized language. Automated context translation and priority routing will execute immediately.
        </p>

        {submitError && (
          <div className="mb-5 p-3.5 bg-[var(--critical)]/10 border border-[var(--critical)]/20 text-[var(--critical)] rounded-lg text-xs font-semibold flex items-center gap-2" aria-live="assertive">
            <AlertCircle size={14} />
            <span>{submitError}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="mb-5 p-4 bg-[var(--low)]/10 border border-[var(--low)]/20 text-[var(--low)] rounded-xl text-xs font-semibold flex flex-col gap-2.5" aria-live="polite">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>Report processed successfully: <strong className="capitalize">{submitSuccess.type}</strong> severity level: <strong className="uppercase">{submitSuccess.severity}</strong></span>
            </div>
            <Link
              to={`/incidents/${submitSuccess._id}`}
              className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-bold"
            >
              View Dispatch Details →
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Textarea description */}
          <div>
            <label htmlFor="incident-desc" className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Incident Description
            </label>
            <div className="relative">
              <textarea
                id="incident-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={PLACEHOLDERS[placeholderIndex]}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition resize-none leading-relaxed"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="mt-2 min-h-[18px]">
              {detectedLang ? (
                <span className="text-[11px] text-[var(--low)] font-semibold flex items-center gap-1.5">
                  <Globe size={12} />
                  <span>[{detectedLang.label}] {detectedLang.lang} detected — auto-translating narrative</span>
                </span>
              ) : (
                <span className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1.5">
                  <Globe size={12} />
                  <span>Multi-lingual intake processing active (17 languages)</span>
                </span>
              )}
            </div>
          </div>

          {/* Stadium select & zone inputs */}
          <div className="space-y-4">
            <div>
              <label htmlFor="stadium-select" className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Stadium Venue
              </label>
              <div className="relative">
                <Landmark size={14} className="absolute left-3 top-3 text-[var(--text-muted)]" />
                <select
                  id="stadium-select"
                  value={stadiumName}
                  onChange={(e) => setStadiumName(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-2.5 pl-9 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition appearance-none cursor-pointer"
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
              <label htmlFor="zone-input" className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
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
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-2.5 pl-9 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Progress State / Button */}
          <div className="pt-2">
            {isSubmitting ? (
              <div className="space-y-3" aria-live="polite" aria-atomic="true">
                <div className="text-[12px] font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                  <span>{AGENT_STEPS[agentStep]}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                    style={{ width: `${(agentStep + 1) * 20}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full h-[46px] bg-[var(--accent)] hover:bg-[var(--accent)]/95 text-white font-bold text-sm rounded-xl cursor-pointer transition select-none flex items-center justify-center gap-2 active:scale-[0.99] shadow-md"
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
