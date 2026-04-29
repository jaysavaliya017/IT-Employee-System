import React from 'react';

type RobotBuddyProps = {
  className?: string;
};

const RobotBuddy: React.FC<RobotBuddyProps> = ({ className = '' }) => {
  return (
    <div className={`robot-buddy ${className}`.trim()}>
      <div className="robot-buddy-head">
        <div className="robot-buddy-eye" />
      </div>
      <div className="robot-buddy-body" />
      <div className="robot-buddy-hover-shadow" />
    </div>
  );
};

export default RobotBuddy;