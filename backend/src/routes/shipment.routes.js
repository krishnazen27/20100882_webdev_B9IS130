const express = require('express');
const shipmentController = require('../controllers/shipment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(shipmentController.getAllShipments)
  .post(authorize('admin', 'operator'), shipmentController.createShipment);

router
  .route('/:id')
  .get(shipmentController.getShipmentById)
  .put(authorize('admin', 'operator'), shipmentController.updateShipment)
  .delete(authorize('admin'), shipmentController.deleteShipment);

module.exports = router;
