import React, { useState } from 'react';
import apiClient from '../api/client';

export default function ShipmentFormModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    billOfLading: '',
    shipmentType: 'IMPORT',
    vesselName: '',
    voyageNumber: '',
    portOfLoading: 'NLRTM',
    portOfDischarge: 'IEDUB',
    etd: '',
    eta: '',
    cargoDescription: '',
    hsCode: '',
    declaredValueUSD: '',
    containerNumber: '',
    sizeType: '40HC',
    sealNumber: '',
    grossWeightKg: 18000
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        billOfLading: form.billOfLading,
        shipmentType: form.shipmentType,
        vesselName: form.vesselName,
        voyageNumber: form.voyageNumber,
        portOfLoading: form.portOfLoading,
        portOfDischarge: form.portOfDischarge,
        etd: form.etd,
        eta: form.eta,
        cargoDescription: form.cargoDescription,
        hsCode: form.hsCode,
        declaredValueUSD: Number(form.declaredValueUSD),
        containers: form.containerNumber
          ? [
              {
                containerNumber: form.containerNumber,
                sizeType: form.sizeType,
                sealNumber: form.sealNumber || 'SL-001',
                grossWeightKg: Number(form.grossWeightKg)
              }
            ]
          : []
      };

      await apiClient.post('/shipments', payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create shipment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div className="modal-card">
        <div className="modal-header">
          <h2 id="modalTitle">Book New SKR-Global Maritime Shipment</h2>
          <button type="button" onClick={onClose} aria-label="Close modal" className="close-btn">&times;</button>
        </div>

        {error && <div className="alert error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="grid-form">
          <div>
            <label htmlFor="bol">Bill of Lading *</label>
            <input id="bol" required placeholder="BOL2026SKR051" value={form.billOfLading} onChange={(e) => setForm({ ...form, billOfLading: e.target.value })} />
          </div>
          <div>
            <label htmlFor="stype">Direction *</label>
            <select id="stype" value={form.shipmentType} onChange={(e) => setForm({ ...form, shipmentType: e.target.value })}>
              <option value="IMPORT">IMPORT</option>
              <option value="EXPORT">EXPORT</option>
              <option value="TRANSSHIPMENT">TRANSSHIPMENT</option>
            </select>
          </div>
          <div>
            <label htmlFor="vessel">Vessel Name *</label>
            <input id="vessel" required placeholder="MV SKR Celtic Star" value={form.vesselName} onChange={(e) => setForm({ ...form, vesselName: e.target.value })} />
          </div>
          <div>
            <label htmlFor="voyage">Voyage # *</label>
            <input id="voyage" required placeholder="SKR-412W" value={form.voyageNumber} onChange={(e) => setForm({ ...form, voyageNumber: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pol">Port of Loading (UN/LOCODE) *</label>
            <input id="pol" required maxLength={5} placeholder="NLRTM" value={form.portOfLoading} onChange={(e) => setForm({ ...form, portOfLoading: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label htmlFor="pod">Port of Discharge (UN/LOCODE) *</label>
            <input id="pod" required maxLength={5} placeholder="IEDUB" value={form.portOfDischarge} onChange={(e) => setForm({ ...form, portOfDischarge: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label htmlFor="etd">Departure Date (ETD) *</label>
            <input id="etd" type="date" required value={form.etd} onChange={(e) => setForm({ ...form, etd: e.target.value })} />
          </div>
          <div>
            <label htmlFor="eta">Arrival Date (ETA) *</label>
            <input id="eta" type="date" required value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} />
          </div>
          <div>
            <label htmlFor="hscode">HS Tariff Code *</label>
            <input id="hscode" required placeholder="8471.50" value={form.hsCode} onChange={(e) => setForm({ ...form, hsCode: e.target.value })} />
          </div>
          <div>
            <label htmlFor="val">Declared Value (USD) *</label>
            <input id="val" type="number" min="0" required placeholder="45000" value={form.declaredValueUSD} onChange={(e) => setForm({ ...form, declaredValueUSD: e.target.value })} />
          </div>
          <div className="full-width">
            <label htmlFor="cargo">Cargo Manifest Description *</label>
            <input id="cargo" required placeholder="Enterprise Server Racks & Optical Transceivers" value={form.cargoDescription} onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })} />
          </div>
          <div>
            <label htmlFor="cnum">ISO 6346 Container #</label>
            <input id="cnum" placeholder="MSCU1234567" value={form.containerNumber} onChange={(e) => setForm({ ...form, containerNumber: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label htmlFor="seal">Customs Seal #</label>
            <input id="seal" placeholder="SKR-98211" value={form.sealNumber} onChange={(e) => setForm({ ...form, sealNumber: e.target.value })} />
          </div>

          <div className="full-width modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Booking...' : 'Save Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
