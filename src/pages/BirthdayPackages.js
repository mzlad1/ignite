import React from "react";
import "./BirthdayPackages.css";

const BirthdayPackages = () => {
  const packages = [
    {
      name: "✨ Spark Package",
      price: "80 ILS/person",
      features: [
        "1 VR session",
        "1 hour of bowling",
        "Reserved seating",
        "For up to 10 people",
      ],
      color: "spark",
    },
    {
      name: "🔥 Blaze Package",
      price: "70 ILS/person",
      features: [
        "1 VR session",
        "1.5 hours of bowling",
        "Reserved seating",
        "For 11–25 people",
      ],
      color: "blaze",
    },
    {
      name: "🔥 Inferno Package",
      price: "60 ILS/person",
      features: [
        "2 VR sessions",
        "1.5 hours of bowling",
        "Reserved seating",
        "For 26+ people",
      ],
      color: "inferno",
    },
  ];

  return (
    <div className="birthday-packages">
      <div className="container">
        <h1>🎉 Birthday Packages</h1>
        <p className="intro">Celebrate your birthday at Ignite Arcade! 🎳</p>
        <p>
          Enjoy bowling, VR games, and nonstop fun in a space full of lights and
          excitement.
        </p>

        <div className="packages-grid">
          {packages.map((pkg, index) => (
            <div key={index} className={`package-card ${pkg.color}`}>
              <h3>{pkg.name}</h3>
              <div className="price">{pkg.price}</div>
              <ul className="features">
                {pkg.features.map((feature, idx) => (
                  <li key={idx}>✔ {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="additional-info">
          <div className="info-card">
            <h3>🎁 Extra Options</h3>
            <p>Add an extra bowling session for just 30 ILS/person!</p>
          </div>

          <div className="info-card">
            <h3>📅 Booking</h3>
            <p>Book now with a 200 ILS deposit.</p>
          </div>

          <div className="info-card">
            <h3>📞 Contact</h3>
            <p>Call us at 0566164488 or email info@ignitearcade.com</p>
          </div>
        </div>

        <div className="cta">
          <h2>Let's make your celebration unforgettable! 🥳</h2>
        </div>
      </div>
    </div>
  );
};

export default BirthdayPackages;
