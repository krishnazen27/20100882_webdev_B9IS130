const mongoose = require('mongoose');

const containerSubSchema = new mongoose.Schema(
  {
    containerNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{4}[0-9]{7}$/, 'Container number must follow ISO 6346 format (e.g., MSCU1234567)']
    },
    sizeType: {
      type: String,
      enum: ['20GP', '40GP', '40HC', '20RF', '40RF'],
      default: '40HC'
    },
    sealNumber: { type: String, required: true, trim: true },
    grossWeightKg: { type: Number, min: 0, max: 35000, required: true }
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    billOfLading: {
      type: String,
      required: [true, 'Bill of Lading number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    shipmentType: {
      type: String,
      enum: ['IMPORT', 'EXPORT', 'TRANSSHIPMENT'],
      required: true
    },
    vesselName: { type: String, required: true, trim: true },
    voyageNumber: { type: String, required: true, uppercase: true, trim: true },
    portOfLoading: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 5,
      maxlength: 5
    },
    portOfDischarge: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 5,
      maxlength: 5
    },
    etd: { type: Date, required: true },
    eta: { type: Date, required: true },
    cargoDescription: { type: String, required: true, maxlength: 500 },
    hsCode: { type: String, required: true, trim: true },
    declaredValueUSD: { type: Number, required: true, min: 0 },
    containers: [containerSubSchema],
    status: {
      type: String,
      enum: ['BOOKED', 'IN_TRANSIT', 'ARRIVED_AT_PORT', 'CUSTOMS_HOLD', 'CLEARED', 'DELIVERED'],
      default: 'BOOKED'
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

shipmentSchema.index({ status: 1, portOfDischarge: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
