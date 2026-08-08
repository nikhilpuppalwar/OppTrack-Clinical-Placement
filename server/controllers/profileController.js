const Profile = require('../models/Profile');
const ActivityLog = require('../models/ActivityLog');

// @GET /api/profile
const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await Profile.create({ userId: req.user._id });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch profile' });
  }
};

// @PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { ...req.body, userId: req.user._id },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    await ActivityLog.create({
      userId: req.user._id,
      opportunityId: null,
      eventType: 'profile_updated',
      description: 'Profile vault updated',
      metadata: {},
    });

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update profile' });
  }
};

module.exports = { getProfile, updateProfile };
