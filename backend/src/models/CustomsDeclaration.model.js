const mongoose = require('mongoose');

const customsDeclarationSchema = new mongoose.Schema(
  {
    declarationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true
    },
    tariffClassification: { type: String, required: true, trim: true },
    dutyAssessedUSD: { type: Number, required: true, min: 0 },
    vatAssessedUSD: { type: Number, required: true, min: 0 },
    inspectionRequired: { type: Boolean, default: false },
    clearanceStatus: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    officerNotes: { type: String, maxlength: 1000, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomsDeclaration', customsDeclarationSchema);
