import mongoose from 'mongoose';

const reasoningTrailSchema = new mongoose.Schema({
  agentName: { type: String, required: true },
  step: { type: Number, required: true },
  thought: { type: String, required: true },
  action: { type: String },
  result: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const incidentSchema = new mongoose.Schema({
  originalDescription: { type: String, required: true },
  detectedLanguage: { type: String, default: 'en' },
  translatedDescription: { type: String },
  stadiumName: { type: String, required: true },
  stadiumCity: { type: String },
  stadiumCapacity: { type: Number },
  stadiumCoordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  zoneLocation: { type: String, required: true },
  type: {
    type: String,
    enum: ['medical', 'security', 'crowd', 'fire', 'weather', 'lost-item', 'other'],
    default: 'other'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['open', 'pending-confirmation', 'escalated', 'resolved', 'flagged-for-review'],
    default: 'open'
  },
  confidence: { type: Number },
  liveContext: {
    weather: {
      temperature: { type: Number },
      weatherCode: { type: Number },
      windspeed: { type: Number },
      precipitation: { type: Number },
      riskFlags: [{ type: String }]
    },
    matchStatus: {
      isMatchToday: { type: Boolean },
      phase: { type: String },
      minute: { type: Number },
      homeTeam: { type: String },
      awayTeam: { type: String },
      crowdRiskLevel: { type: String }
    },
    combinedRiskLevel: { type: String },
    contextSummary: { type: String },
    fetchedAt: { type: Date }
  },
  reasoningTrail: [reasoningTrailSchema],
  finalDecision: { type: String },
  actionsTaken: [{ type: String }],
  humanOverride: { type: Boolean, default: false },
  humanConfirmedAt: { type: Date },
  resolvedAt: { type: Date },
  incidentReport: {
    executiveSummary: String,
    incidentNarrative: String,
    rootCauseAnalysis: String,
    immediateActionsLog: [String],
    recommendedFollowUp: [String],
    lessonsLearned: String,
    estimatedResolutionTime: String,
    riskRating: String,
    preventionMeasures: [String],
    generatedAt: Date,
    emailSent: Boolean
  },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ stadiumName: 1 });

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;
