import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  "🔵 Agent 1: Detecting language & matching stadium...",
  "🔵 Agent 2: Classifying incident with AI...",
  "🔵 Agent 3: Fetching live weather & match status...",
  "🔵 Agent 4: AI reasoning & deciding action...",
  "🔵 Agent 5: Generating incident report & sending email..."
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
      return { lang: 'Marathi', flag: '🇮🇳', confidence: 'high' };
    }
    return { lang: 'Hindi', flag: '🇮🇳', confidence: 'high' };
  }
  if (arabicUrdu.test(text)) {
    if (text.includes("ہے") || text.includes("تھا") || text.includes("کیا")) {
      return { lang: 'Urdu', flag: '🇵🇰', confidence: 'high' };
    }
    return { lang: 'Arabic', flag: '🇸🇦', confidence: 'high' };
  }
  if (tamil.test(text)) {
    return { lang: 'Tamil', flag: '🇮🇳', confidence: 'high' };
  }
  if (kannada.test(text)) {
    return { lang: 'Kannada', flag: '🇮🇳', confidence: 'high' };
  }
  if (malayalam.test(text)) {
    return { lang: 'Malayalam', flag: '🇮🇳', confidence: 'high' };
  }
  if (japanese.test(text)) {
    return { lang: 'Japanese', flag: '🇯🇵', confidence: 'high' };
  }
  if (korean.test(text)) {
    return { lang: 'Korean', flag: '🇰🇷', confidence: 'high' };
  }
  if (chinese.test(text)) {
    return { lang: 'Chinese (Mandarin)', flag: '🇨🇳', confidence: 'high' };
  }

  const textLower = text.toLowerCase();
  if (/\b(el|la|los|que|y|en|un|una|del|es)\b/.test(textLower)) {
    return { lang: 'Spanish', flag: '🇪🇸', confidence: 'high' };
  }
  if (/\b(le|la|les|que|et|dans|un|une|est)\b/.test(textLower)) {
    return { lang: 'French', flag: '🇫🇷', confidence: 'high' };
  }
  if (/\b(o|a|os|as|que|e|em|um|uma|do|da|é)\b/.test(textLower)) {
    return { lang: 'Portuguese', flag: '🇵🇹', confidence: 'high' };
  }
  if (/\b(der|die|das|und|ist|in|ein|eine|von|mit)\b/.test(textLower)) {
    return { lang: 'German', flag: '🇩🇪', confidence: 'high' };
  }
  if (/\b(de|het|een|en|is|in|van|op|met)\b/.test(textLower)) {
    return { lang: 'Dutch', flag: '🇳🇱', confidence: 'high' };
  }
  if (/\b(kuna|ni|na|katika|ya|wa|kwa|ni)\b/.test(textLower)) {
    return { lang: 'Swahili', flag: '🇰🇪', confidence: 'high' };
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
    <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 shadow-sm relative overflow-hidden select-none" aria-labelledby="form-title">
      <h2 id="form-title" className="text-lg font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
        <span aria-hidden="true">🚨</span> Report New Incident
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-5">
        Submit in any language — AI handles translation, risk scoring, and dispatch.
      </p>

      {submitError && (
        <div className="mb-4 p-3 bg-[var(--critical)]/10 border border-[var(--critical)]/25 text-[var(--critical)] rounded-lg text-xs font-semibold" aria-live="assertive">
          <span aria-hidden="true">⚠️</span> {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 p-3.5 bg-[var(--low)]/10 border border-[var(--low)]/20 text-[var(--low)] rounded-lg text-xs font-semibold flex flex-col gap-2" aria-live="polite">
          <div>
            <span aria-hidden="true">✅</span> Incident processed! Type: <span className="underline">{submitSuccess.type}</span> | Severity: <span className="underline">{submitSuccess.severity}</span> | Status: <span className="underline">{submitSuccess.status}</span>
          </div>
          <Link
            to={`/incidents/${submitSuccess._id}`}
            className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-bold"
          >
            View Details →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Textarea description */}
        <div>
          <label htmlFor="incident-desc" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Incident Description *
          </label>
          <div className="relative">
            <textarea
              id="incident-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition resize-none leading-relaxed"
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="mt-1.5 min-h-[18px]">
            {detectedLang ? (
              <span className="text-[11px] text-[var(--low)] font-semibold flex items-center gap-1">
                <span aria-hidden="true">{detectedLang.flag}</span> {detectedLang.lang} detected — will auto-translate to English
              </span>
            ) : (
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                <span aria-hidden="true">🌐</span> Type in any of 17 supported languages
              </span>
            )}
          </div>
        </div>

        {/* Stadium select & zone inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="stadium-select" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Stadium *
            </label>
            <select
              id="stadium-select"
              value={stadiumName}
              onChange={(e) => setStadiumName(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition"
              disabled={isSubmitting}
              required
            >
              <option value="">Select FIFA 2026 Stadium...</option>
              {stadiums.map((stadium, i) => (
                <option key={i} value={stadium.name}>
                  {stadium.name} — {stadium.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="zone-input" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Zone / Location *
            </label>
            <input
              id="zone-input"
              type="text"
              value={zoneLocation}
              onChange={(e) => setZoneLocation(e.target.value)}
              placeholder="e.g. Gate 4, Section 12"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition"
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        {/* Submit Progress State / Button */}
        {isSubmitting ? (
          <div className="space-y-2 pt-2" aria-live="polite" aria-atomic="true">
            <div className="text-[12px] font-medium text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>{AGENT_STEPS[agentStep]}</span>
            </div>
            {/* Animated progress bar */}
            <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                style={{ width: `${(agentStep + 1) * 20}%` }}
              />
            </div>
            <button
              type="button"
              className="w-full h-[44px] bg-[var(--border)] text-[var(--text-muted)] font-bold text-sm rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5"
              disabled
              aria-disabled="true"
            >
              <span aria-hidden="true">⏳</span> Processing...
            </button>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full h-[44px] bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold text-sm rounded-lg cursor-pointer transition select-none flex items-center justify-center gap-1.5 active:scale-[0.99] shadow-sm"
          >
            <span aria-hidden="true">🚨</span> Report Incident
          </button>
        )}
      </form>
    </section>
  );
}
