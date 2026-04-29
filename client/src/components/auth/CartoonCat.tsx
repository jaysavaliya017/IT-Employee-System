import React from 'react';

type CartoonCatProps = {
  className?: string;
};

const CartoonCat: React.FC<CartoonCatProps> = ({ className = '' }) => {
  return (
    <div className={`cartoon-cat ${className}`.trim()}>
      <div className="cartoon-cat-ear left" />
      <div className="cartoon-cat-ear right" />
      <div className="cartoon-cat-head">
        <div className="cartoon-cat-eye left" />
        <div className="cartoon-cat-eye right" />
        <div className="cartoon-cat-nose" />
        <div className="cartoon-cat-whisker left" />
        <div className="cartoon-cat-whisker right" />
        <div className="cartoon-cat-smile" />
      </div>
      <div className="cartoon-cat-body" />
      <div className="cartoon-cat-belly" />
      <div className="cartoon-cat-tail" />
      <div className="cartoon-cat-leg front-left" />
      <div className="cartoon-cat-leg front-right" />
      <div className="cartoon-cat-leg back-left" />
      <div className="cartoon-cat-leg back-right" />
    </div>
  );
};

export default CartoonCat;
