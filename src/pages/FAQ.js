import React, { useState } from "react";
import "./FAQ.css";

const FAQ = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      question: "How long is each bowling session?",
      answer:
        "Each bowling session is 45 minutes long, giving you plenty of time to enjoy strikes, spares, and maybe a few gutter balls with friends!",
    },
    {
      question: "How many people can play per lane?",
      answer:
        "Maximum 6 people per lane. Perfect for small groups, families, or birthday parties!",
    },
    {
      question: "What are your operating hours?",
      answer:
        "We're open daily from 3:00 PM to 11:00 PM. Come and experience the cosmic fun anytime during these hours!",
    },
    {
      question: "How many rounds can we play?",
      answer:
        "You can play a maximum of 3 rounds per booking. Each round gives you fresh chances to beat your high score!",
    },
    {
      question: "How can I cancel my booking?",
      answer:
        "For cancellations, please contact us at 0566164488. We'll help you reschedule or process your cancellation quickly.",
    },
    {
      question: "How many bowling lanes do you have?",
      answer:
        "We have 6 modern bowling lanes available for booking, each equipped with the latest technology for the best gaming experience.",
    },
    {
      question: "Do you offer birthday packages?",
      answer:
        "Yes! We have 3 different birthday packages featuring VR sessions, extended bowling time, and reserved seating. Perfect for making memories!",
    },
    {
      question: "Can I book in advance?",
      answer:
        "Absolutely! You can book sessions in advance through our online booking system. We recommend booking early, especially for weekends and special events.",
    },
    {
      question: "Do you have VR gaming available?",
      answer:
        "Yes! Our VR gaming zone offers immersive virtual reality experiences. VR sessions are included in our birthday packages or can be booked separately.",
    },
    {
      question: "Is there food and drinks available?",
      answer:
        "Visit our Grab & Giggle Café for refreshing drinks and snacks! Perfect for recharging between games or celebrating your victories.",
    },
  ];

  const handleFAQToggle = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="faq-page">
      {/* Character Decorations */}
      <div className="faq-zoe-main"></div>
      <div className="faq-enzo-helper"></div>
      <div className="faq-zoe-helper"></div>

      <div className="container">
        <h1>❓ Frequently Asked Questions</h1>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${openFAQ === index ? "active" : ""}`}
            >
              <div
                className="faq-question"
                onClick={() => handleFAQToggle(index)}
              >
                <h3>{faq.question}</h3>
                <span className="toggle">{openFAQ === index ? "−" : "+"}</span>
              </div>
              {openFAQ === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="contact-info">
          <h2>Still have questions?</h2>
          <p>
            Contact us at <strong>0566164488</strong> or visit us during our
            operating hours!
            <br />
            <span style={{ fontSize: "0.9em", opacity: "0.8" }}>
              Our cosmic crew is always ready to help you plan the perfect
              arcade adventure! 🚀
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
