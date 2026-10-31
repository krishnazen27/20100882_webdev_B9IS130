const Shipment = require('../models/Shipment.model');
const CustomsDeclaration = require('../models/CustomsDeclaration.model');
const { getPortWeatherAdvisory } = require('../services/portWeather.service');

exports.getAllShipments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'client') {
      filter.client = req.user._id;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.shipmentType) filter.shipmentType = req.query.shipmentType;

    const shipments = await Shipment.find(filter)
      .populate('client', 'fullName companyName email')
      .sort({ createdAt: -1 })
      .lean();

    const shipmentIds = shipments.map((s) => s._id);
    const declarations = await CustomsDeclaration.find({ shipment: { $in: shipmentIds } })
      .select('shipment declarationNumber clearanceStatus officerNotes inspectionRequired reviewedAt')
      .lean();

    const declMap = {};
    declarations.forEach((d) => {
      declMap[d.shipment.toString()] = d;
    });

    const enrichedShipments = shipments.map((s) => ({
      ...s,
      customsInfo: req.user.role === 'client' ? null : declMap[s._id.toString()] || null
    }));

    res.status(200).json({
      success: true,
      count: enrichedShipments.length,
      data: enrichedShipments
    });
  } catch (error) {
    next(error);
  }
};

exports.getShipmentById = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('client', 'fullName companyName email')
      .populate('createdBy', 'fullName role');

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    if (req.user.role === 'client' && shipment.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this shipment record.' });
    }

    const weatherAdvisory = await getPortWeatherAdvisory(shipment.portOfDischarge);

    res.status(200).json({
      success: true,
      data: shipment,
      weatherAdvisory
    });
  } catch (error) {
    next(error);
  }
};

exports.createShipment = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      client: req.body.client || req.user._id,
      createdBy: req.user._id
    };
    const shipment = await Shipment.create(payload);

    res.status(201).json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

exports.updateShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    res.status(200).json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

exports.deleteShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }
    res.status(200).json({ success: true, message: 'Shipment deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
