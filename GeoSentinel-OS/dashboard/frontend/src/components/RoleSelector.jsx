import React from "react";

const ROLES = ["taluka_admin", "district_admin", "state_admin"];

export default function RoleSelector({ role, onChange }) {
  return (
    <div className="panel">
      <div className="panel-header">Role View</div>
      <div className="role-row">
        {ROLES.map((item) => (
          <button
            key={item}
            className={role === item ? "btn active" : "btn"}
            onClick={() => onChange(item)}
            type="button"
          >
            {item.replace("_", " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
