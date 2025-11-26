import React from "react";
import { Card } from "react-bootstrap";

const SummaryCard = ({ title, count, color, icon: Icon }) => {
  return (
    <Card className="summary-card flex-grow-1" style={{ minWidth: "240px" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="text-uppercase text-muted mb-0" style={{ fontSize: "0.85rem" }}>
          {title}
        </h4>
        {Icon && (
          <div className={`bg-${color} bg-opacity-10 p-2 rounded-circle`}>
            <Icon size={20} className={`text-${color}`} />
          </div>
        )}
      </div>
      <div className="count">{count}</div>
      <small className="text-muted">Total {title.toLowerCase()}</small>
    </Card>
  );
};

export default SummaryCard;