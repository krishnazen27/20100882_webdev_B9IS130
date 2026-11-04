const CustomsDeclaration = require('../models/CustomsDeclaration.model');
const Shipment = require('../models/Shipment.model');

exports.getAllDeclarations = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.clearanceStatus) {
      filter.clearanceStatus = req.query.clearanceStatus;
    }

    const declarations = await CustomsDeclaration.find(filter)
      .populate(
        'shipment',
        'billOfLading shipmentType vesselName voyageNumber portOfLoading portOfDischarge etd eta cargoDescription hsCode declaredValueUSD containers status'
      )
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: declarations.length, data: declarations });
  } catch (error) {
    next(error);
  }
};

exports.createDeclaration = async (req, res, next) => {
  try {
    const declaration = await CustomsDeclaration.create(req.body);
    res.status(201).json({ success: true, data: declaration });
  } catch (error) {
    next(error);
  }
};

exports.reviewDeclaration = async (req, res, next) => {
  try {
    const { clearanceStatus, officerNotes, inspectionRequired } = req.body;
    const declaration = await CustomsDeclaration.findByIdAndUpdate(
      req.params.id,
      {
        clearanceStatus,
        officerNotes,
        inspectionRequired: Boolean(inspectionRequired),
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!declaration) {
      return res.status(404).json({ success: false, message: 'Customs declaration not found.' });
    }

    const statusMap = {
      APPROVED: 'CLEARED',
      REJECTED: 'CUSTOMS_HOLD',
      UNDER_REVIEW: 'ARRIVED_AT_PORT',
      PENDING: 'IN_TRANSIT'
    };

    if (statusMap[clearanceStatus]) {
      await Shipment.findByIdAndUpdate(declaration.shipment, { status: statusMap[clearanceStatus] });
    }

    res.status(200).json({ success: true, data: declaration });
  } catch (error) {
    next(error);
  }
};
