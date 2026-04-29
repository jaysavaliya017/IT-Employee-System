import React from 'react';

type CartoonMouseProps = {
  className?: string;
};

const CartoonMouse: React.FC<CartoonMouseProps> = ({ className = '' }) => {
  return (
    <div className={`cartoon-mouse ${className}`.trim()}>
      <div className="cartoon-mouse-cheese" />
      <div className="cartoon-mouse-ear left" />
      <div className="cartoon-mouse-ear right" />
      <div className="cartoon-mouse-head">
        <div className="cartoon-mouse-eye left" />
        <div className="cartoon-mouse-eye right" />
        <div className="cartoon-mouse-nose" />
        <div className="cartoon-mouse-whisker left" />
        <div className="cartoon-mouse-whisker right" />
      </div>
      <div className="cartoon-mouse-body" />
      <div className="cartoon-mouse-arm left" />
      <div className="cartoon-mouse-arm right" />
      <div className="cartoon-mouse-tail" />
      <div className="cartoon-mouse-leg left" />
      <div className="cartoon-mouse-leg right" />
    </div>
  );
};

export default CartoonMouse;
