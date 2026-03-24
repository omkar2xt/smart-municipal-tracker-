import React from "react";

export default function WorkersTable({ workers }) {
  const safeWorkers = Array.isArray(workers) ? workers : [];

  return (
    <div className="panel">
      <div className="panel-header">Workers</div>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>District</th>
            <th>Taluka</th>
          </tr>
        </thead>
        <tbody>
          {safeWorkers.length === 0 ? (
            <tr>
              <td colSpan="5" className="empty">No workers found</td>
            </tr>
          ) : (
            safeWorkers.map((worker, index) => (
              <tr key={worker?.id ?? `worker-${index}`}>
                <td>{worker?.id ?? "-"}</td>
                <td>{worker?.name || "-"}</td>
                <td>{worker?.role || "-"}</td>
                <td>{worker?.district || "-"}</td>
                <td>{worker?.taluka || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
