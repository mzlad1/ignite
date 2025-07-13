# Environment Variables Setup

This project uses environment variables to store sensitive configuration data like API keys and service credentials.

## Setup Instructions

1. **Copy the example file:**

   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values in the `.env` file:**
   - Replace all placeholder values with your actual API keys and configuration
   - Never commit the `.env` file to version control

## Required Environment Variables

### Firebase Configuration

- `REACT_APP_FIREBASE_API_KEY`: Your Firebase API key
- `REACT_APP_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `REACT_APP_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `REACT_APP_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `REACT_APP_FIREBASE_APP_ID`: Your Firebase app ID
- `REACT_APP_FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID (optional)

### EmailJS Configuration

- `REACT_APP_EMAILJS_PUBLIC_KEY`: Your EmailJS public key
- `REACT_APP_EMAILJS_SERVICE_ID`: Your EmailJS service ID
- `REACT_APP_EMAILJS_TEMPLATE_APPROVAL`: Template ID for approval emails
- `REACT_APP_EMAILJS_TEMPLATE_REJECTION`: Template ID for rejection emails

### Cloudinary Configuration

- `REACT_APP_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `REACT_APP_CLOUDINARY_UPLOAD_PRESET`: Your Cloudinary upload preset

## Important Notes

- All environment variables for React must start with `REACT_APP_`
- Restart your development server after adding new environment variables
- The `.env` file is ignored by git to prevent accidentally committing secrets
- Use `.env.example` as a template for new developers

## Troubleshooting

If you see errors about missing environment variables:

1. Make sure your `.env` file exists in the project root
2. Check that all required variables are defined
3. Restart your development server
4. Verify variable names match exactly (case-sensitive)
