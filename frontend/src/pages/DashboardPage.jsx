import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import ShipmentFormModal from '../components/ShipmentFormModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedWeather, setSelectedWeather] = useState(null);
  const [selectedCustomsPopup, setSelectedCustomsPopup] = useState(null);

  const isClient = user?.role === 'client';
  const canCreate = ['admin', 'operator'].includes(user?.role);

  const fetchShipments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await apiClient.get('/shipments', { params });
      setShipments(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load shipments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [statusFilter]);

  const inspectPortWeather = async (shipmentId) => {
    try {
      const res = await apiClient.get(`/shipments/${shipmentId}`);
      setSelectedWeather(res.data.weatherAdvisory);
    } catch {
      setError('Unable to fetch destination port weather telemetry.');
    }
  };

  const handleDelete = async (shipmentId) => {
    if (!window.confirm('Delete this shipment record permanently?')) return;
    try {
      await apiClient.delete(`/shipments/${shipmentId}`);
      fetchShipments();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete action failed.');
    }
  };

  const handleStatusClick = (shipment) => {
    if (isClient) return;
    setSelectedCustomsPopup(shipment);
  };

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <h1>SKR-Global Shipments Console</h1>
          <p className="muted">
            {isClient
              ? 'Your Active Consignments & Real-Time Shipment Status'
              : 'Import/Export Bills of Lading, Vessel Schedules & Customs Status'}
          </p>
        </div>
        <div className="toolbar">
          <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
          <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="ARRIVED_AT_PORT">Arrived at Port</option>
            <option value="CUSTOMS_HOLD">Customs Hold</option>
            <option value="CLEARED">Cleared</option>
            <option value="DELIVERED">Delivered</option>
          </select>

          {canCreate && (
            <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
              + New Shipment
            </button>
          )}
        </div>
      </div>

      {selectedWeather && !isClient && (
        <section className="weather-banner" aria-live="polite">
          <div>
            <strong>Destination Port Telemetry ({selectedWeather.port} — {selectedWeather.portCode}):</strong>{' '}
            {selectedWeather.condition}, Wind {selectedWeather.windSpeedKnots} knots | Advisory:{' '}
            <span className="badge">{selectedWeather.berthingAdvisory}</span>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setSelectedWeather(null)}>Dismiss</button>
        </section>
      )}

      {error && <div className="alert error" role="alert">{error}</div>}

      {loading ? (
        <div className="alert">Loading SKR-Global shipment manifests...</div>
      ) : (
        <div className="table-card">
          <table aria-label="Maritime Shipments Table">
            <thead>
              <tr>
                <th>Bill of Lading</th>
                <th>Type</th>
                <th>Vessel / Voyage</th>
                <th>Route (POL &rarr; POD)</th>
                <th>ETA</th>
                <th>Containers</th>
                <th>Status {!isClient && <small>(Click to view customs message)</small>}</th>
                {!isClient && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.billOfLading}</strong></td>
                  <td>{s.shipmentType}</td>
                  <td>{s.vesselName} ({s.voyageNumber})</td>
                  <td>{s.portOfLoading} &rarr; {s.portOfDischarge}</td>
                  <td>{new Date(s.eta).toLocaleDateString()}</td>
                  <td>{s.containers?.map((c) => c.containerNumber).join(', ') || 'None'}</td>
                  <td>
                    {isClient ? (
                      <span className={`badge status-${s.status.toLowerCase()}`}>
                        {s.status.replaceAll('_', ' ')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={`badge status-${s.status.toLowerCase()} clickable-badge`}
                        title="Click to view customs clearance message"
                        onClick={() => handleStatusClick(s)}
                      >
                        {s.status.replaceAll('_', ' ')} &#9432;
                      </button>
                    )}
                  </td>
                  {!isClient && (
                    <td className="actions-cell">
                      <button type="button" className="btn-small" onClick={() => inspectPortWeather(s._id)}>
                        Port Weather
                      </button>
                      {user?.role === 'admin' && (
                        <button type="button" className="btn-small danger" onClick={() => handleDelete(s._id)}>
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {shipments.length === 0 && (
                <tr>
                  <td colSpan={isClient ? 7 : 8} className="empty-state">No shipments found for the current filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ShipmentFormModal onClose={() => setShowModal(false)} onCreated={fetchShipments} />
      )}

      {selectedCustomsPopup && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="customsMsgTitle">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 id="customsMsgTitle">Customs Status — {selectedCustomsPopup.billOfLading}</h2>
              <button type="button" onClick={() => setSelectedCustomsPopup(null)} className="close-btn">&times;</button>
            </div>
            <div className="stack-form">
              <p>
                <strong>Shipment Status:</strong>{' '}
                <span className={`badge status-${selectedCustomsPopup.status.toLowerCase()}`}>
                  {selectedCustomsPopup.status.replaceAll('_', ' ')}
                </span>
              </p>
              {selectedCustomsPopup.customsInfo ? (
                <>
                  <p><strong>Declaration #:</strong> {selectedCustomsPopup.customsInfo.declarationNumber}</p>
                  <p><strong>Customs Clearance State:</strong> {selectedCustomsPopup.customsInfo.clearanceStatus}</p>
                  <p>
                    <strong>Physical Inspection Required:</strong>{' '}
                    {selectedCustomsPopup.customsInfo.inspectionRequired ? 'Yes' : 'No'}
                  </p>
                  <div className="reason-box">
                    <strong>Customs Officer Message / Reason:</strong>
                    <p>{selectedCustomsPopup.customsInfo.officerNotes || 'No remarks recorded by customs yet.'}</p>
                  </div>
                </>
              ) : (
                <div className="alert">No customs declaration linked to this shipment yet.</div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-primary" onClick={() => setSelectedCustomsPopup(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
