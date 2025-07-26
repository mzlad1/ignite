import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./FAQ.css";

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const faqsSnapshot = await getDocs(collection(db, "faqs"));
      setFaqs(faqsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    }
    setLoading(false);
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      {/* Character Decorations */}
      <div className="faq-zoe-main"></div>

      <div className="container">
        <h1>❓ Frequently Asked Questions</h1>

        <div className="faq-list">
          {loading ? (
            <div className="loading">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="no-faqs">
              <p>No FAQs available at the moment.</p>
            </div>
          ) : (
            faqs.map((faq, index) => (
              <div key={faq.id} className="faq-item">
                <div
                  className={`faq-question ${
                    openIndex === index ? "active" : ""
                  }`}
                  onClick={() => toggleFAQ(index)}
                >
                  <h3>{faq.question}</h3>
                  <span className="faq-toggle">
                    {openIndex === index ? "−" : "+"}
                  </span>
                </div>
                <div
                  className={`faq-answer ${openIndex === index ? "open" : ""}`}
                >
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))
          )}
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
