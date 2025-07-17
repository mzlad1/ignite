import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import "./Menu.css";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1400 },
      items: 4,
    },
    desktop: {
      breakpoint: { max: 1400, min: 1024 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 768 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 768, min: 0 },
      items: 1,
    },
  };

  // Custom dot component
  const CustomDot = ({ onClick, ...rest }) => {
    const {
      onMove,
      index,
      active,
      carouselState: { currentSlide, deviceType },
    } = rest;

    return (
      <li>
        <button
          className={active ? "active" : "inactive"}
          onClick={() => onClick()}
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            border: `2px solid ${
              active ? "#ff7f00" : "rgba(255, 127, 0, 0.5)"
            }`,
            background: active ? "#ff7f00" : "transparent",
            cursor: "pointer",
            padding: "0",
            outline: "none",
            transition: "all 0.3s ease",
            boxShadow: active ? "0 0 15px rgba(255, 127, 0, 0.6)" : "none",
            transform: active ? "scale(1.3)" : "scale(1)",
          }}
        />
      </li>
    );
  };

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
          <div className="menu-carousel-container">
            <Carousel
              responsive={responsive}
              infinite={true}
              autoPlay={true}
              autoPlaySpeed={3000}
              keyBoardControl={true}
              customTransition="all .5s"
              transitionDuration={500}
              containerClass="menu-carousel"
              removeArrowOnDeviceType={["tablet", "mobile"]}
              showDots={true}
              renderDotsOutside={true}
              customDot={<CustomDot />}
              dotListClass="custom-dot-list-style"
              itemClass="menu-carousel-item"
            >
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
                </div>
              ))}
            </Carousel>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
