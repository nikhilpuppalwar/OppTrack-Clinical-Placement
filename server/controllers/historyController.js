const ActivityLog = require('../models/ActivityLog');

// @GET /api/history
const getHistory = async (req, res) => {
  try {
    const { eventType, company, limit = 50, page = 1 } = req.query;
    const query = { userId: req.user._id };

    if (eventType) query.eventType = eventType;

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('opportunityId', 'company role');

    const total = await ActivityLog.countDocuments(query);

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Error fetching history logs:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch history logs', logs: [], total: 0 });
  }
};

module.exports = { getHistory };
