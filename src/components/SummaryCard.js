import React from 'react';

const SummaryCard = ({ title, count, color }) => {
  return (
    <div className={`card text-white bg-${color} mb-3`} style={{ width: '18rem' }}>
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <h2>{count}</h2>
      </div>
    </div>
  );
};

export default SummaryCard;
