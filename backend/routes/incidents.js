import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Incident from '../models/Incident.js';
import { runPipeline } from '../pipeline/agentPipeline.js';

import fetch from 'node-fetch';

const router = express.Router();
const statsRouter = express.Router();

router.get('/stadiums', async (req, res) => {
  try {
    const response = await fetch(
      'https://worldcup26.ir/get/stadiums')
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('[STADIUMS] Failed:', error)
    res.status(500).json({ 
      error: 'Failed to fetch stadiums' 
    })
  }
})

const incidentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many incident reports. Please wait 15 minutes.'
  }
});

// POST /api/incidents
router.post('/', incidentLimiter, async (req, res, next) => {
  try {
    const { description, stadiumName, zoneLocation } = req.body;
    
    // Validate existence
    if (!description || !stadiumName || !zoneLocation) {
      return res.status(400).json({ error: "Missing required fields: description, stadiumName, and zoneLocation are required." });
    }

    // Validate length limits
    if (description.length > 1000) {
      return res.status(400).json({ error: "description exceeds maximum length of 1000 characters." });
    }
    if (stadiumName.length > 100) {
      return res.status(400).json({ error: "stadiumName exceeds maximum length of 100 characters." });
    }
    if (zoneLocation.length > 100) {
      return res.status(400).json({ error: "zoneLocation exceeds maximum length of 100 characters." });
    }

    // Pre-generate MongoDB ObjectID to bind the pipeline and webhook references
    const incidentId = new mongoose.Types.ObjectId();

    // Execute full 5-agent pipeline
    const pipelineResult = await runPipeline(description, stadiumName, zoneLocation, incidentId);

    // Save incident to database
    const incident = new Incident(pipelineResult);
    await incident.save();

    res.status(201).json({ success: true, incident });
  } catch (error) {
    next(error);
  }
});

// GET /api/incidents (excluding reasoningTrail for lightweight list payloads)
router.get('/', async (req, res, next) => {
  try {
    const incidents = await Incident.find({})
      .select('originalDescription stadiumName zoneLocation type severity status confidence actionsTaken createdAt detectedLanguage liveContext.weather.temperature liveContext.matchStatus.phase humanOverride humanConfirmedAt resolvedAt finalDecision')
      .sort({ createdAt: -1 })
      .lean();
    res.json(incidents);
  } catch (error) {
    next(error);
  }
});

// GET /api/incidents/:id (full object including reasoningTrail)
router.get('/:id', async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }
    res.json(incident);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/incidents/:id/confirm
router.patch('/:id/confirm', async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    if (incident.status !== 'pending-confirmation') {
      return res.status(400).json({ error: "Incident status is not pending-confirmation" });
    }

    incident.status = 'escalated';
    incident.humanConfirmedAt = new Date();
    incident.reasoningTrail.push({
      agentName: 'Human Operator',
      step: incident.reasoningTrail.length + 1,
      thought: '[HUMAN] Operator confirmed recommended AI action.',
      action: 'CONFIRM_RECOMMENDATION',
      result: 'Status changed to escalated',
      timestamp: new Date()
    });

    await incident.save();
    res.json(incident);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/incidents/:id/override
router.patch('/:id/override', async (req, res, next) => {
  try {
    const { newStatus, overrideReason } = req.body;
    if (!newStatus || !overrideReason) {
      return res.status(400).json({ error: "Missing required fields: newStatus and overrideReason are required." });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    incident.humanOverride = true;
    incident.status = newStatus;
    incident.reasoningTrail.push({
      agentName: 'Human Operator',
      step: incident.reasoningTrail.length + 1,
      thought: `[HUMAN] Human operator overrode AI decision. Reason: ${overrideReason}`,
      action: 'HUMAN_OVERRIDE',
      result: `Status changed to ${newStatus}`,
      timestamp: new Date()
    });

    await incident.save();
    res.json(incident);
  } catch (error) {
    next(error);
  }
});

// GET /api/stats (Aggregation)
statsRouter.get('/', async (req, res, next) => {
  try {
    const stats = await Incident.aggregate([
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          avgConf: [{ $group: { _id: null, avg: { $avg: "$confidence" } } }],
          bySeverity: [{ $group: { _id: "$severity", count: { $sum: 1 } } }],
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          byType: [{ $group: { _id: "$type", count: { $sum: 1 } } }],
          byStadium: [{ $group: { _id: "$stadiumName", count: { $sum: 1 } } }]
        }
      }
    ]);

    const result = stats[0] || {};
    const totalIncidents = result.totalCount?.[0]?.count || 0;
    const avgConfidence = result.avgConf?.[0]?.avg || 0;

    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    if (result.bySeverity) {
      result.bySeverity.forEach(item => {
        if (item._id && bySeverity.hasOwnProperty(item._id)) {
          bySeverity[item._id] = item.count;
        }
      });
    }

    const byStatus = { open: 0, 'pending-confirmation': 0, escalated: 0, resolved: 0, 'flagged-for-review': 0 };
    if (result.byStatus) {
      result.byStatus.forEach(item => {
        if (item._id && byStatus.hasOwnProperty(item._id)) {
          byStatus[item._id] = item.count;
        }
      });
    }

    const byType = { medical: 0, security: 0, crowd: 0, fire: 0, weather: 0, 'lost-item': 0, other: 0 };
    if (result.byType) {
      result.byType.forEach(item => {
        if (item._id && byType.hasOwnProperty(item._id)) {
          byType[item._id] = item.count;
        }
      });
    }

    const byStadium = {};
    if (result.byStadium) {
      result.byStadium.forEach(item => {
        if (item._id) {
          byStadium[item._id] = item.count;
        }
      });
    }

    res.json({
      totalIncidents,
      bySeverity,
      byStatus,
      byType,
      byStadium,
      avgConfidence
    });
  } catch (error) {
    next(error);
  }
});

export { router as incidentsRouter, statsRouter };
