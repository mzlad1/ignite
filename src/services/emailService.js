import emailjs from "@emailjs/browser";

// Validate required environment variables
const requiredEmailEnvVars = [
  "REACT_APP_EMAILJS_PUBLIC_KEY",
  "REACT_APP_EMAILJS_SERVICE_ID",
  "REACT_APP_EMAILJS_TEMPLATE_APPROVAL",
  "REACT_APP_EMAILJS_TEMPLATE_REJECTION",
];

for (const envVar of requiredEmailEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize EmailJS with your public key
emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);

const EMAIL_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAIL_TEMPLATE_ID_APPROVAL =
  process.env.REACT_APP_EMAILJS_TEMPLATE_APPROVAL;
const EMAIL_TEMPLATE_ID_REJECTION =
  process.env.REACT_APP_EMAILJS_TEMPLATE_REJECTION;

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
