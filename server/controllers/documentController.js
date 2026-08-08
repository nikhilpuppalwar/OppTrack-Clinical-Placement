const Document = require('../models/Document');

// @GET /api/documents
const getDocuments = async (req, res) => {
  const docs = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(docs);
};

// @POST /api/documents
const addDocument = async (req, res) => {
  const { type, label, fileUrl, isDefault } = req.body;
  if (!type || !label || !fileUrl)
    return res.status(400).json({ message: 'type, label, and fileUrl are required.' });

  // If this is set as default, unset other defaults of same type
  if (isDefault) {
    await Document.updateMany({ userId: req.user._id, type }, { isDefault: false });
  }

  const doc = await Document.create({ userId: req.user._id, type, label, fileUrl, isDefault: !!isDefault });
  res.status(201).json(doc);
};

// @PUT /api/documents/:id
const updateDocument = async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
  if (!doc) return res.status(404).json({ message: 'Document not found.' });

  if (req.body.isDefault) {
    await Document.updateMany({ userId: req.user._id, type: doc.type }, { isDefault: false });
  }

  Object.assign(doc, req.body);
  await doc.save();
  res.json(doc);
};

// @DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  const doc = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!doc) return res.status(404).json({ message: 'Document not found.' });
  res.json({ message: 'Document deleted.' });
};

module.exports = { getDocuments, addDocument, updateDocument, deleteDocument };
