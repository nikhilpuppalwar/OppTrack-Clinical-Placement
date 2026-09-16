const Profile = require('../models/Profile');
const ActivityLog = require('../models/ActivityLog');

// @GET /api/profile
const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });
    let needsSave = false;

    if (!profile) {
      profile = new Profile({ userId: req.user._id });
      needsSave = true;
    }

    // Auto-populate baseline candidate details from User registration if missing
    if (!profile.candidateName && req.user.name) {
      profile.candidateName = req.user.name;
      needsSave = true;
    }
    if (!profile.personalEmail && req.user.email) {
      profile.personalEmail = req.user.email;
      needsSave = true;
    }
    if (!profile.collegeName && req.user.collegeName) {
      profile.collegeName = req.user.collegeName;
      needsSave = true;
    }
    if (!profile.branch && req.user.branch) {
      profile.branch = req.user.branch;
      needsSave = true;
    }
    if (!profile.passingYear && req.user.batch) {
      profile.passingYear = req.user.batch;
      needsSave = true;
    }

    if (needsSave) {
      await profile.save();
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch profile' });
  }
};

// @PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const payload = { ...req.body, userId: req.user._id };

    // Synchronize top-level fields from fields array for backward compatibility & direct query
    if (Array.isArray(payload.fields)) {
      payload.fields.forEach((f) => {
        if (!f.isCustom && f.id && f.value !== undefined && f.value !== null) {
          payload[f.id] = f.value;
        }
      });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      payload,
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
