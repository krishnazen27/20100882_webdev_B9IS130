import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const CUSTOMS_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

export default function CustomsPage() {
  const { user } = useAuth();
  const [declarations, setDeclarations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeDecl, setActiveDecl] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('PENDING');
  const [officerNotes, setOfficerNotes] = useState('');
  const [inspectionRequired, setInspectionRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDeclarations = async () => {
    setLoading(true);
    setError('');
    try {
      const params = statusFilter ? { clearanceStatus: statusFilter } : {};
      const res = await apiClient.get('/customs', { params });
      setDeclarations(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load customs declarations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeclarations();
  }, [statusFilter]);

  const openBolReviewModal = (decl) => {
    setActiveDecl(decl);
    setReviewStatus(decl.clearanceStatus || 'PENDING');
    setOfficerNotes(decl.officerNotes || '');
    setInspectionRequired(Boolean(decl.inspectionRequired));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!activeDecl) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.patch(`/customs/${activeDecl._id}/review`, {
        clearanceStatus: reviewStatus,
        officerNotes,
        inspectionRequired
      });
      setActiveDecl(null);
      loadDeclarations();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save customs decision.');
    } finally {
      setSaving(false);
    }
  };

  const canReview = ['admin', 'customs'].includes(user?.role);

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <h1>SKR-Global Customs Clearance Console</h1>
          <p className="muted">Click any Bill of Lading (BoL) to inspect manifest details and update customs status & reason</p>
        </div>
        <div className="toolbar">
          <label htmlFor="customsStatusFilter" className="sr-only">Filter by Customs Status</label>
          <select
            id="customsStatusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Customs Statuses</option>
            {CUSTOMS_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}

      {loading ? (
        <div className="alert">Loading customs declarations...</div>
      ) : (
        <div className="table-card">
          <table aria-label="Customs Declarations Table">
            <thead>
              <tr>
                <th>Declaration #</th>
                <th>Bill of Lading (Click to Review)</th>
                <th>Tariff Code</th>
                <th>Duty (USD)</th>
                <th>VAT (USD)</th>
                <th>Customs Status</th>
                <th>Reason / Officer Notes</th>
                {canReview && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {declarations.map((d) => (
                <tr key={d._id}>
                  <td><strong>{d.declarationNumber}</strong></td>
                  <td>
                    <button
                      type="button"
                      className="bol-link-btn"
                      onClick={() => openBolReviewModal(d)}
                    >
                      {d.shipment?.billOfLading || 'N/A'}
                    </button>
                  </td>
                  <td>{d.tariffClassification}</td>
                  <td>${d.dutyAssessedUSD?.toFixed(2)}</td>
                  <td>${d.vatAssessedUSD?.toFixed(2)}</td>
                  <td>
                    <span className={`badge status-${d.clearanceStatus.toLowerCase()}`}>
                      {d.clearanceStatus.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="reason-cell">{d.officerNotes || '—'}</td>
                  {canReview && (
                    <td>
                      <button type="button" className="btn-small" onClick={() => openBolReviewModal(d)}>
                        Review BoL
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {declarations.length === 0 && (
                <tr>
                  <td colSpan={canReview ? 8 : 7} className="empty-state">
                    No customs declarations found for the selected status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeDecl && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bolModalTitle">
          <div className="modal-card">
            <div className="modal-header">
              <h2 id="bolModalTitle">
                Bill of Lading Review — {activeDecl.shipment?.billOfLading}
              </h2>
              <button type="button" onClick={() => setActiveDecl(null)} className="close-btn">&times;</button>
            </div>

            {activeDecl.shipment && (
              <div className="bol-details-grid">
                <div><strong>Declaration #:</strong> {activeDecl.declarationNumber}</div>
                <div><strong>Direction:</strong> {activeDecl.shipment.shipmentType}</div>
                <div><strong>Vessel / Voyage:</strong> {activeDecl.shipment.vesselName} ({activeDecl.shipment.voyageNumber})</div>
                <div><strong>Route:</strong> {activeDecl.shipment.portOfLoading} &rarr; {activeDecl.shipment.portOfDischarge}</div>
                <div><strong>HS Tariff Code:</strong> {activeDecl.shipment.hsCode}</div>
                <div><strong>Declared Value:</strong> ${activeDecl.shipment.declaredValueUSD?.toLocaleString()}</div>
                <div className="full-width"><strong>Cargo Description:</strong> {activeDecl.shipment.cargoDescription}</div>
                <div className="full-width">
                  <strong>Containers:</strong>{' '}
                  {activeDecl.shipment.containers?.map((c) => `${c.containerNumber} (${c.sizeType}, ${c.grossWeightKg}kg)`).join(' | ') || 'None'}
                </div>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="stack-form" style={{ marginTop: '1rem' }}>
              <div>
                <label htmlFor="reviewStatus">Update Customs Clearance Status *</label>
                <select
                  id="reviewStatus"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  required
                >
                  {CUSTOMS_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="officerNotes">Customs Reason / Inspection Notes *</label>
                <textarea
                  id="officerNotes"
                  rows="3"
                  required
                  placeholder="Enter reason for approval, hold, or physical inspection..."
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                />
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={inspectionRequired}
                  onChange={(e) => setInspectionRequired(e.target.checked)}
                />
                <span>Flag container for physical customs scan / inspection</span>
              </label>

              <div className="modal-actions">
                <button type="button" onClick={() => setActiveDecl(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Updating...' : 'Save Customs Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
