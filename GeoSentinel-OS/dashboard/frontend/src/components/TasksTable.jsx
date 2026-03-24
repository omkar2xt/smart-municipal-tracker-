import React from "react";

export default function TasksTable({ tasks }) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="panel">
      <div className="panel-header">Tasks</div>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Proof</th>
          </tr>
        </thead>
        <tbody>
          {safeTasks.length === 0 ? (
            <tr>
              <td colSpan="5" className="empty">No tasks found</td>
            </tr>
          ) : (
            safeTasks.map((task, index) => (
              <tr key={task?.id ?? `task-${index}`}>
                <td>{task?.id ?? "-"}</td>
                <td>{task?.title || "-"}</td>
                <td>
                  <span className={task?.status === "COMPLETED" ? "badge done" : "badge pending"}>
                    {task?.status || "UNKNOWN"}
                  </span>
                </td>
                <td>{task?.assigned_to ?? "-"}</td>
                <td>{task?.image_proof || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
