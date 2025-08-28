import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../contexts/ToastContext";
import "./TournamentRegistration.css";

const TournamentRegistration = () => {
  const { showSuccess, showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    teamName: "",
    player1Name: "",
    player1Age: "",
    player2Name: "",
    player2Age: "",
    contactNumber: "",
    howDidYouHear: "",
    agreement: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Function to convert Arabic numerals to English numerals
  const convertArabicToEnglish = (text) => {
    const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const englishNumerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    let converted = text;
    arabicNumerals.forEach((arabic, index) => {
      converted = converted.replace(
        new RegExp(arabic, "g"),
        englishNumerals[index]
      );
    });
    return converted;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Convert Arabic numerals to English for age fields
    let processedValue = value;
    if (name === "player1Age" || name === "player2Age") {
      processedValue = convertArabicToEnglish(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : processedValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.teamName.trim()) {
      newErrors.teamName = "اسم الفريق مطلوب";
    }

    if (!formData.player1Name.trim()) {
      newErrors.player1Name = "اسم اللاعب الأول مطلوب";
    }

    if (!formData.player1Age.trim()) {
      newErrors.player1Age = "عمر اللاعب الأول مطلوب";
    } else if (
      isNaN(formData.player1Age) ||
      formData.player1Age < 10 ||
      formData.player1Age > 100
    ) {
      newErrors.player1Age = "يرجى إدخال عمر صحيح";
    }

    if (!formData.player2Name.trim()) {
      newErrors.player2Name = "اسم اللاعب الثاني مطلوب";
    }

    if (!formData.player2Age.trim()) {
      newErrors.player2Age = "عمر اللاعب الثاني مطلوب";
    } else if (
      isNaN(formData.player2Age) ||
      formData.player2Age < 10 ||
      formData.player2Age > 100
    ) {
      newErrors.player2Age = "يرجى إدخال عمر صحيح";
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "رقم التواصل مطلوب";
    } else if (!/^[0-9+\-\s()]+$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "يرجى إدخال رقم هاتف صحيح";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.howDidYouHear) {
      newErrors.howDidYouHear = "يرجى اختيار كيف سمعت عن البطولة";
    }

    if (!formData.agreement) {
      newErrors.agreement = "يجب الموافقة على الشروط والأحكام";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(1);
  };

  const validateForm = () => {
    return validateStep1() && validateStep2();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Add tournament registration to Firestore
      await addDoc(collection(db, "tournamentRegistrations"), {
        ...formData,
        registrationDate: serverTimestamp(),
        status: "pending",
        paymentStatus: "pending",
        totalFee: 120, // 60 shekel per player
      });

      showSuccess("تم تسجيل فريقك بنجاح! سنتواصل معك قريباً لتأكيد التسجيل.");

      // Reset form and go back to terms
      setFormData({
        teamName: "",
        player1Name: "",
        player1Age: "",
        player2Name: "",
        player2Age: "",
        contactNumber: "",
        howDidYouHear: "",
        agreement: false,
      });
      setCurrentStep(1);
      setTermsAccepted(false);
      setShowForm(false);
    } catch (error) {
      console.error("Error registering for tournament:", error);
      showError("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
    }

    setLoading(false);
  };

  const handleTermsAccept = () => {
    setShowForm(true);
  };

  const handleBackToTerms = () => {
    setTermsAccepted(false);
    setShowForm(false);
    setCurrentStep(1);
    setFormData({
      teamName: "",
      player1Name: "",
      player1Age: "",
      player2Name: "",
      player2Age: "",
      contactNumber: "",
      howDidYouHear: "",
      agreement: false,
    });
    setErrors({});
  };

  return (
    <div className="tournament-registration">
      <div className="tournament-container">
        <div className="tournament-header">
          <h1>🏆التسجيل في مسابقة ايجنايت للبولينغ</h1>
        </div>

        <div className="tournament-content">
          {/* Tournament Info Sidebar */}
          <div className="tournament-info-sidebar">
            <div className="tournament-info">
              <div className="tournament-welcome-text">
                <h2>أهلاً وسهلاً فيكم! ⚡️</h2>
                <p>
                  متحمسين نشوفكم وتكونوا جزء من هالتحدي! فرصة حلوة تقضوا وقت
                  ممتع وتتنافسوا على جوائز رهيبة!
                </p>
              </div>
              <div className="tournament-info-item">
                <span className="tournament-info-icon">📅</span>
                <span>تاريخ المسابقة: 13/9/2025 (يوم السبت)</span>
              </div>
              <div className="tournament-info-item">
                <span className="tournament-info-icon">⏰</span>
                <span>الساعة: 6:00 مساءً</span>
              </div>
              <div className="tournament-info-item">
                <span className="tournament-info-icon">💰</span>
                <span>رسوم الاشتراك: 60 شيكل لكل لاعب</span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="tournament-main-content-area">
            {!showForm ? (
              // Terms Section - Show First
              <div className="tournament-terms-section-full">
                <h3>الشروط والأحكام</h3>
                <div className="tournament-terms-content">
                  <h4>شروط التسجيل:</h4>
                  <ul>
                    <li>يجب أن يتكون كل فريق من لاعبين (2)</li>
                    <li>رسوم الاشتراك 60 شيكل لكل لاعب</li>
                    <li>يتثبت التسجيل فور وصول رسوم الاشتراك</li>
                  </ul>

                  <h4>قواعد المسابقة:</h4>
                  <ul>
                    <li>الفريق صاحب أعلى نتيجة في كل جولة يتأهل إلى النهائي</li>
                    <li>
                      كل فريق سيشارك في جولة واحدة فقط ما عدا الجولة النهائية في
                      حال التأهل
                    </li>
                    <li>يتنافس أفضل فرق في الجولة النهائية لتحديد الفائز</li>
                    <li>يتم لعب جولة اضافية في حال التعادل</li>
                    <li>يجب على اللاعبين انتظار دورهم واحترام حدود المسارات</li>
                    <li>
                      يجب قراءة والالتزام بالارشادات المتواجدة في منطقة البولينغ
                    </li>
                    <li>أي تصرف غير اخلاقي يؤدي إلى استبعاد اللاعب</li>
                  </ul>

                  <div className="tournament-terms-acceptance">
                    <label className="tournament-checkbox-label">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                      <span className="tournament-checkbox-text">
                        أؤكد أنني قرأت ووافقت على الالتزام بقواعد وإرشادات
                        المسابقة
                      </span>
                    </label>
                    <button
                      className="tournament-continue-btn"
                      onClick={handleTermsAccept}
                      disabled={!termsAccepted}
                    >
                      {termsAccepted
                        ? "متابعة التسجيل"
                        : "يرجى قبول الشروط أولاً"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Registration Form - Show After Terms Acceptance
              <div className="tournament-registration-form-container">
                <form onSubmit={handleSubmit} className="registration-form">
                  <div className="tournament-form-header">
                    <button
                      type="button"
                      className="tournament-back-to-terms-btn"
                      onClick={handleBackToTerms}
                    >
                      ← العودة للشروط
                    </button>
                  </div>

                  <div className="tournament-form-progress">
                    <div
                      className={`tournament-progress-step ${
                        currentStep >= 1 ? "active" : ""
                      }`}
                    >
                      <span className="tournament-step-number">1</span>
                      <span className="tournament-step-label">
                        معلومات الفريق
                      </span>
                    </div>
                    <div
                      className={`tournament-progress-step ${
                        currentStep >= 2 ? "active" : ""
                      }`}
                    >
                      <span className="tournament-step-number">2</span>
                      <span className="tournament-step-label">
                        التأكيد والموافقة
                      </span>
                    </div>
                  </div>

                  {currentStep === 1 && (
                    <div className="tournament-form-step">
                      <div className="tournament-form-group">
                        <label htmlFor="teamName">اسم الفريق *</label>
                        <input
                          type="text"
                          id="teamName"
                          name="teamName"
                          value={formData.teamName}
                          onChange={handleInputChange}
                          placeholder="أدخل اسم الفريق"
                          className={errors.teamName ? "error" : ""}
                          disabled={loading}
                        />
                        {errors.teamName && (
                          <span className="tournament-error-message">
                            {errors.teamName}
                          </span>
                        )}
                      </div>

                      <div className="tournament-players-section">
                        <h4>اللاعب الأول</h4>
                        <div className="tournament-player-fields">
                          <div className="tournament-form-group">
                            <label htmlFor="player1Name">الاسم الكامل *</label>
                            <input
                              type="text"
                              id="player1Name"
                              name="player1Name"
                              value={formData.player1Name}
                              onChange={handleInputChange}
                              placeholder="أدخل الاسم الكامل"
                              className={errors.player1Name ? "error" : ""}
                              disabled={loading}
                            />
                            {errors.player1Name && (
                              <span className="tournament-error-message">
                                {errors.player1Name}
                              </span>
                            )}
                          </div>

                          <div className="tournament-form-group">
                            <label htmlFor="player1Age">العمر *</label>
                            <input
                              type="number"
                              id="player1Age"
                              name="player1Age"
                              value={formData.player1Age}
                              onChange={handleInputChange}
                              placeholder="ادخل عمرك"
                              min="10"
                              max="100"
                              className={errors.player1Age ? "error" : ""}
                              disabled={loading}
                            />
                            {errors.player1Age && (
                              <span className="tournament-error-message">
                                {errors.player1Age}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="tournament-players-section">
                        <h4>اللاعب الثاني</h4>
                        <div className="tournament-player-fields">
                          <div className="tournament-form-group">
                            <label htmlFor="player2Name">الاسم الكامل *</label>
                            <input
                              type="text"
                              id="player2Name"
                              name="player2Name"
                              value={formData.player2Name}
                              onChange={handleInputChange}
                              placeholder="أدخل الاسم الكامل"
                              className={errors.player2Name ? "error" : ""}
                              disabled={loading}
                            />
                            {errors.player2Name && (
                              <span className="tournament-error-message">
                                {errors.player2Name}
                              </span>
                            )}
                          </div>

                          <div className="tournament-form-group">
                            <label htmlFor="player2Age">العمر *</label>
                            <input
                              type="number"
                              id="player2Age"
                              name="player2Age"
                              value={formData.player2Age}
                              onChange={handleInputChange}
                              placeholder="ادخل عمرك"
                              min="10"
                              max="100"
                              className={errors.player2Age ? "error" : ""}
                              disabled={loading}
                            />
                            {errors.player2Age && (
                              <span className="tournament-error-message">
                                {errors.player2Age}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="tournament-form-group">
                        <label htmlFor="contactNumber">رقم للتواصل *</label>
                        <input
                          type="tel"
                          id="contactNumber"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleInputChange}
                          placeholder="أدخل رقم الهاتف"
                          className={errors.contactNumber ? "error" : ""}
                          disabled={loading}
                        />
                        {errors.contactNumber && (
                          <span className="tournament-error-message">
                            {errors.contactNumber}
                          </span>
                        )}
                      </div>

                      <div className="tournament-form-actions">
                        <button
                          type="button"
                          className="tournament-next-btn"
                          onClick={handleNext}
                          disabled={loading}
                        >
                          التالي
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="tournament-form-step">
                      <div className="tournament-form-group">
                        <label>كيف سمعت عن بطولة ايجنايت للبولنغ؟ *</label>
                        <div className="tournament-radio-group">
                          {[
                            {
                              value: "social-media",
                              label: "وسائل التواصل الاجتماعي",
                            },
                            {
                              value: "ignite-team",
                              label: "فريق العمل في ايجنايت",
                            },
                            { value: "friend-family", label: "صديق او عائلة" },
                            { value: "other", label: "أخرى" },
                          ].map((option) => (
                            <label
                              key={option.value}
                              className="tournament-radio-option"
                            >
                              <input
                                type="radio"
                                name="howDidYouHear"
                                value={option.value}
                                checked={
                                  formData.howDidYouHear === option.value
                                }
                                onChange={handleInputChange}
                                disabled={loading}
                              />
                              <span className="tournament-radio-label">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                        {errors.howDidYouHear && (
                          <span className="tournament-error-message">
                            {errors.howDidYouHear}
                          </span>
                        )}
                      </div>

                      <div className="tournament-form-group">
                        <label className="tournament-checkbox-label">
                          <input
                            type="checkbox"
                            name="agreement"
                            checked={formData.agreement}
                            onChange={handleInputChange}
                            disabled={loading}
                          />
                          <span className="tournament-checkbox-text">
                            أؤكد أنني قرأت ووافقت على الالتزام بقواعد وإرشادات
                            المسابقة *
                          </span>
                        </label>
                        {errors.agreement && (
                          <span className="tournament-error-message">
                            {errors.agreement}
                          </span>
                        )}
                      </div>

                      <div className="tournament-form-actions">
                        <button
                          type="button"
                          className="tournament-prev-btn"
                          onClick={handlePrevious}
                          disabled={loading}
                        >
                          السابق
                        </button>
                        <button
                          type="submit"
                          className="tournament-submit-btn"
                          disabled={loading}
                        >
                          {loading ? "جاري التسجيل..." : "تسجيل الفريق"}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentRegistration;
