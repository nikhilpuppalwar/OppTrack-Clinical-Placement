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

// @POST /api/profile/field - Add a new field (custom or standard)
const createField = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new Profile({ userId: req.user._id, fields: [] });
    }

    const { id, section, label, fieldType, options, value, sensitive, isCustom } = req.body;
    if (!label) {
      return res.status(400).json({ message: 'Field label is required' });
    }

    const generatedId = id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Remove from deletedFieldIds if it was previously deleted
    if (profile.deletedFieldIds && profile.deletedFieldIds.includes(generatedId)) {
      profile.deletedFieldIds = profile.deletedFieldIds.filter(fId => fId !== generatedId);
    }

    // Check if field already exists in fields
    const existingIndex = profile.fields.findIndex(f => f.id === generatedId);
    const newField = {
      id: generatedId,
      section: section || 'custom',
      label: label.trim(),
      fieldType: fieldType || 'short_text',
      options: options || [],
      value: value !== undefined ? String(value) : '',
      hidden: false,
      isCustom: isCustom !== undefined ? isCustom : true,
      sensitive: !!sensitive,
    };

    if (existingIndex >= 0) {
      profile.fields[existingIndex] = { ...profile.fields[existingIndex].toObject(), ...newField };
    } else {
      profile.fields.push(newField);
    }

    // Sync top-level if known standard field
    if (!newField.isCustom && profile.schema.paths[generatedId]) {
      profile[generatedId] = newField.value;
    }

    await profile.save();

    await ActivityLog.create({
      userId: req.user._id,
      opportunityId: null,
      eventType: 'profile_updated',
      description: `Created profile field: ${newField.label}`,
      metadata: { fieldId: generatedId, label: newField.label },
    });

    res.status(201).json({ message: 'Field created successfully', field: newField, profile });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create field' });
  }
};

// @PUT /api/profile/field/:fieldId - Update an individual field value or properties
const updateField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new Profile({ userId: req.user._id, fields: [] });
    }

    const { value, label, fieldType, options, section, sensitive, hidden } = req.body;

    let fieldIndex = profile.fields.findIndex(f => f.id === fieldId);
    let updatedField;

    if (fieldIndex >= 0) {
      if (value !== undefined) profile.fields[fieldIndex].value = String(value);
      if (label !== undefined) profile.fields[fieldIndex].label = label;
      if (fieldType !== undefined) profile.fields[fieldIndex].fieldType = fieldType;
      if (options !== undefined) profile.fields[fieldIndex].options = options;
      if (section !== undefined) profile.fields[fieldIndex].section = section;
      if (sensitive !== undefined) profile.fields[fieldIndex].sensitive = sensitive;
      if (hidden !== undefined) profile.fields[fieldIndex].hidden = hidden;
      updatedField = profile.fields[fieldIndex];
    } else {
      // If field doesn't exist yet in fields array (e.g. from standard fields)
      updatedField = {
        id: fieldId,
        section: section || 'personal',
        label: label || fieldId,
        fieldType: fieldType || 'short_text',
        options: options || [],
        value: value !== undefined ? String(value) : '',
        hidden: !!hidden,
        isCustom: false,
        sensitive: !!sensitive,
      };
      profile.fields.push(updatedField);
    }

    // Sync top-level schema field if present
    if (profile.schema.paths[fieldId] && value !== undefined) {
      profile[fieldId] = String(value);
    }

    await profile.save();

    res.json({ message: 'Field updated successfully', field: updatedField, profile });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update field' });
  }
};

// @DELETE /api/profile/field/:fieldId - Delete any field (custom or standard)
const deleteField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Remove from fields array
    profile.fields = profile.fields.filter(f => f.id !== fieldId);

    // Track as deleted so standard fields won't resurrect
    if (!profile.deletedFieldIds) {
      profile.deletedFieldIds = [];
    }
    if (!profile.deletedFieldIds.includes(fieldId)) {
      profile.deletedFieldIds.push(fieldId);
    }

    // Clear top-level field if it's a standard property
    if (profile.schema.paths[fieldId]) {
      profile[fieldId] = '';
    }

    await profile.save();

    await ActivityLog.create({
      userId: req.user._id,
      opportunityId: null,
      eventType: 'profile_updated',
      description: `Deleted profile field: ${fieldId}`,
      metadata: { fieldId },
    });

    res.json({ message: 'Field deleted successfully', fieldId, profile });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete field' });
  }
};

// @POST /api/profile/restore-defaults - Restore standard fields by resetting deletedFieldIds
const restoreDefaultFields = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new Profile({ userId: req.user._id });
    }

    profile.deletedFieldIds = [];
    await profile.save();

    res.json({ message: 'Default fields restored', profile });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to restore default fields' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  createField,
  updateField,
  deleteField,
  restoreDefaultFields,
};
