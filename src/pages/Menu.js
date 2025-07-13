import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./Menu.css";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const menuSnapshot = await getDocs(collection(db, "menu"));
      setMenuItems(
        menuSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
    setLoading(false);
  };

  return (
    <div className="menu">
      <div className="container">
        <h1> Menu Café</h1>
        <p>Delicious food and refreshing drinks to fuel your gaming session!</p>

        {loading ? (
          <div className="loading">Loading menu...</div>
        ) : menuItems.length === 0 ? (
          <div className="no-items">
            <p>No menu items available at the moment.</p>
          </div>
        ) : (
          <div className="menu-grid">
            {menuItems.map((item) => (
              <div key={item.id} className="menu-item">
                <div className="item-image">
                  {item.image.startsWith("http") ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "auto",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <span>{item.image}</span>
                  )}
                </div>
                <h3>{item.name}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
