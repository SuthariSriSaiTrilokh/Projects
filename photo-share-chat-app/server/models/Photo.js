const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Expose _id as id in JSON
photoSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
photoSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Photo', photoSchema);
