// Environment variable validation and configuration

export const validateEnvironment = () => {
  const requiredVars = [
    // Firebase
    "REACT_APP_FIREBASE_API_KEY",
    "REACT_APP_FIREBASE_AUTH_DOMAIN",
    "REACT_APP_FIREBASE_PROJECT_ID",
    "REACT_APP_FIREBASE_STORAGE_BUCKET",
    "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
    "REACT_APP_FIREBASE_APP_ID",

    // EmailJS
    "REACT_APP_EMAILJS_PUBLIC_KEY",
    "REACT_APP_EMAILJS_SERVICE_ID",
    "REACT_APP_EMAILJS_TEMPLATE_APPROVAL",
    "REACT_APP_EMAILJS_TEMPLATE_REJECTION",

    // Cloudinary
    "REACT_APP_CLOUDINARY_CLOUD_NAME",
    "REACT_APP_CLOUDINARY_UPLOAD_PRESET",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.error(`- ${varName}`);
    });

    if (process.env.NODE_ENV === "development") {
      console.error(
        "\nPlease create a .env file in your project root and add the missing variables."
      );
      console.error("You can use .env.example as a template.");
    }

    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
};

export const config = {
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  },
  emailjs: {
    publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY,
    serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID,
    templateApproval: process.env.REACT_APP_EMAILJS_TEMPLATE_APPROVAL,
    templateRejection: process.env.REACT_APP_EMAILJS_TEMPLATE_REJECTION,
  },
  cloudinary: {
    cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
  },
};
