import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./Offers.css";

const Offers = () => {
  const [pointsData, setPointsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const offersSnapshot = await getDocs(collection(db, "offers"));
      const offers = offersSnapshot.docs.map((doc) => ({
        id: doc.id,
        buy: doc.data().spend,
        get: doc.data().get,
      }));
      // Sort by spend amount
      offers.sort((a, b) => a.buy - b.buy);
      setPointsData(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
    }
    setLoading(false);
  };

  return (
    <div className="offers-page">
      <div className="offers-container">
        <h1>🌟 Special Offers & Loyalty Program</h1>

        <div className="characters-intro">
          <div className="character-card">
            <img
              src="https://res.cloudinary.com/dxqxjaruh/image/upload/f_auto,q_auto,c_scale,w_400/v1753546486/Enzo1_wxl5jb.png"
              alt="Enzo"
              className="character-img"
            />
            <h3>Meet Enzo!</h3>
            <p>Your bowling buddy who loves rewards!</p>
          </div>
          <div className="character-card">
            <img
              src="https://res.cloudinary.com/dxqxjaruh/image/upload/f_auto,q_auto,c_scale,w_400/v1753546803/zoe1_uqewcu.png"
              alt="Zoe"
              className="character-img"
            />
            <h3>Meet Zoe!</h3>
            <p>She'll help you earn amazing points!</p>
          </div>
        </div>

        <div className="points-system">
          <h2>💰 Spend Money, Earn More Points!</h2>
          <p className="points-subtitle">
            The more you spend, the more bonus points you get!
          </p>

          <div className="points-grid">
            {loading ? (
              <div className="loading">Loading offers...</div>
            ) : pointsData.length === 0 ? (
              <div className="no-offers">
                <p>No offers available at the moment.</p>
              </div>
            ) : (
              pointsData.map((item) => (
                <div key={item.id} className="points-card">
                  <div className="spend-amount">
                    <span className="currency">₪</span>
                    <span className="amount">{item.buy}</span>
                    <span className="label">Spend</span>
                  </div>

                  <div className="arrow">
                    <span>→</span>
                  </div>

                  <div className="get-amount">
                    <span className="points">{item.get}</span>
                    <span className="label">Points</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="points-benefits">
            <h3>🎯 What can you do with points?</h3>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon">🎳</span>
                <h4>Free Bowling</h4>
                <p>Use points for free games</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🥽</span>
                <h4>VR Sessions</h4>
                <p>Unlock VR experiences</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Offers;
