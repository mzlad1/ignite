import emailjs from "@emailjs/browser";

// Initialize EmailJS with your public key
emailjs.init("3AU1RwSSy_BN9h50e"); // Replace with your EmailJS public key

const EMAIL_SERVICE_ID = "service_khshse4"; // Replace with your EmailJS service ID
const EMAIL_TEMPLATE_ID_APPROVAL = "template_6otg3tv"; // Replace with your approval template ID
const EMAIL_TEMPLATE_ID_REJECTION = "template_a0rqonu"; // Replace with your rejection template ID

export const sendApprovalEmail = async (bookingDetails) => {
  try {
    // Ensure email exists
    if (!bookingDetails.email || bookingDetails.email.trim() === "") {
      throw new Error("No email address provided");
    }

    const templateParams = {
      to_email: bookingDetails.email.trim(),
      to_name: bookingDetails.name,
      from_name: "Bowling Center Team",
      reply_to: "noreply@bowlingcenter.com", // Replace with your business email
      subject: `✅ Bowling Booking Confirmed - ${bookingDetails.date}`,
      booking_date: bookingDetails.date,
      booking_time: bookingDetails.time,
      booking_people: bookingDetails.people,
      booking_rounds: bookingDetails.rounds || "N/A",
      booking_phone: bookingDetails.phone,
      booking_type: bookingDetails.type,
      booking_package: bookingDetails.bundleName || "Regular Bowling",
      booking_id: bookingDetails.id,
      message: `Great news! Your bowling booking has been confirmed.`,
      // Add these for better email delivery
      user_name: bookingDetails.name,
      user_email: bookingDetails.email.trim(),
    };

    console.log("Sending approval email with params:", templateParams); // Debug log

    const response = await emailjs.send(
      EMAIL_SERVICE_ID,
      EMAIL_TEMPLATE_ID_APPROVAL,
      templateParams
    );

    return { success: true, response };
  } catch (error) {
    console.error("Error sending approval email:", error);
    return { success: false, error: error.message };
  }
};

export const sendRejectionEmail = async (bookingDetails, reason = "") => {
  try {
    // Ensure email exists
    if (!bookingDetails.email || bookingDetails.email.trim() === "") {
      throw new Error("No email address provided");
    }

    const templateParams = {
      to_email: bookingDetails.email.trim(),
      to_name: bookingDetails.name,
      from_name: "Bowling Center Team",
      reply_to: "noreply@bowlingcenter.com", // Replace with your business email
      subject: `❌ Bowling Booking Update - ${bookingDetails.date}`,
      booking_date: bookingDetails.date,
      booking_time: bookingDetails.time,
      booking_people: bookingDetails.people,
      booking_rounds: bookingDetails.rounds || "N/A",
      booking_phone: bookingDetails.phone,
      booking_type: bookingDetails.type,
      booking_package: bookingDetails.bundleName || "Regular Bowling",
      booking_id: bookingDetails.id,
      rejection_reason:
        reason ||
        "Unfortunately, we cannot accommodate your booking at the requested time.",
      message: `We regret to inform you that your booking request cannot be confirmed.`,
      // Add these for better email delivery
      user_name: bookingDetails.name,
      user_email: bookingDetails.email.trim(),
    };

    console.log("Sending rejection email with params:", templateParams); // Debug log

    const response = await emailjs.send(
      EMAIL_SERVICE_ID,
      EMAIL_TEMPLATE_ID_REJECTION,
      templateParams
    );

    return { success: true, response };
  } catch (error) {
    console.error("Error sending rejection email:", error);
    return { success: false, error: error.message };
  }
};

// Test function to validate email service setup
export const testEmailService = async () => {
  try {
    const testParams = {
      to_email: "test@example.com",
      to_name: "Test User",
      from_name: "Bowling Center Team",
      subject: "Test Email",
      message: "This is a test email to verify EmailJS setup.",
    };

    const response = await emailjs.send(
      EMAIL_SERVICE_ID,
      EMAIL_TEMPLATE_ID_APPROVAL,
      testParams
    );

    return { success: true, response };
  } catch (error) {
    console.error("Email service test failed:", error);
    return { success: false, error: error.message };
  }
};
