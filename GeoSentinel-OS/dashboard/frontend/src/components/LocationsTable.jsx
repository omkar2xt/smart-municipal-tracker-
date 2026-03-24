import React from "react";

const maskCoordinate = (value) => {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return value.toFixed(3);
};

export default function LocationsTable({ locations }) {
  const safeLocations = Array.isArray(locations) ? locations : [];

  return (
    <div className="panel">
      <div className="panel-header">GPS Locations</div>
      <table className="table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {safeLocations.length === 0 ? (
            <tr>
              <td colSpan="4" className="empty">No location logs found</td>
            </tr>
          ) : (
            safeLocations.map((row, index) => (
              <tr key={`${row?.user_id ?? "u"}-${row?.timestamp || index}-${index}`}>
                <td>{row?.user_id ?? "-"}</td>
                <td>{maskCoordinate(row?.latitude)}</td>
                <td>{maskCoordinate(row?.longitude)}</td>
                <td>{row?.timestamp || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
