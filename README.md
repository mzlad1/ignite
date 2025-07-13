# 🎳 Ignite Arcade - Bowling & Entertainment Center

A modern, full-featured web application for a bowling and arcade entertainment center, built with React.js and Firebase. Features cosmic-themed design with animated characters (Enzo and Zoe) and comprehensive management systems.

![Ignite Arcade](https://img.shields.io/badge/React-18.x-blue) ![Firebase](https://img.shields.io/badge/Firebase-9.x-orange) ![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

### 🎮 Customer Features

- **Interactive Home Page** with animated cosmic theme and character integration
- **Menu Display** with dynamic food and beverage items
- **Special Offers & Loyalty Program** with points system
- **Real-time Booking System** with calendar integration and availability checking
- **Birthday Packages** with customizable options and pricing
- **Customer Feedback System** with star ratings and like/dislike functionality
- **FAQ Section** with expandable questions and answers
- **Responsive Design** optimized for all devices

### 👨‍💼 Admin Features

- **Role-based Authentication System** (Manager/Reception Staff)
- **Comprehensive Booking Management** with email notifications
- **Menu Item Management** with Cloudinary image uploads
- **Customer Feedback Moderation** with deletion capabilities
- **Birthday Package Configuration** with dynamic pricing and features
- **Points & Offers Management** for loyalty program
- **FAQ Content Management** system
- **User Management** for admin accounts
- **Reception Calendar** for daily booking overview

### 🎨 Design Features

- **Cosmic Theme** with animated backgrounds and floating elements
- **Character Integration** featuring Enzo and Zoe mascots throughout the site
- **Smooth Animations** and hover effects for enhanced user experience
- **Modern UI Components** with glassmorphism effects
- **Mobile-first Responsive Design** with optimized layouts
- **Custom CSS** with advanced keyframe animations

## 🚀 Technology Stack

### Frontend

- **React.js 18.x** - Modern React with hooks and functional components
- **React Router v6** - Client-side routing with protected routes
- **CSS3** - Custom styling with advanced animations and responsive design
- **React Calendar** - Interactive calendar component for bookings

### Backend & Services

- **Firebase Authentication** - Secure user authentication system
- **Firestore Database** - NoSQL database for real-time data management
- **EmailJS** - Email service for booking confirmations and notifications
- **Cloudinary** - Image hosting and optimization service

### Key Libraries

- **React Router DOM** - Navigation and routing
- **Firebase SDK** - Backend services integration
- **EmailJS** - Email functionality
- **React Calendar** - Date picker component

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 14.x or higher)
- **npm** or **yarn** package manager
- **Firebase Account** with project setup
- **EmailJS Account** for email services
- **Cloudinary Account** for image hosting

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bowlingReact
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

Create a `firebase.js` file in the `src` directory:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 4. EmailJS Configuration

Update the email service configuration in `src/services/emailService.js`:

```javascript
const EMAIL_SERVICE_ID = "your-emailjs-service-id";
const EMAIL_TEMPLATE_ID_APPROVAL = "your-approval-template-id";
const EMAIL_TEMPLATE_ID_REJECTION = "your-rejection-template-id";
```

### 5. Cloudinary Configuration

Update the Cloudinary settings in `src/pages/admin/JanaDashboard.js`:

```javascript
formData.append("upload_preset", "your-upload-preset");
// Replace with your cloud name
("https://api.cloudinary.com/v1_1/your-cloud-name/image/upload");
```

### 6. Start the Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🗂️ Project Structure

```
bowlingReact/
├── public/
│   ├── images/           # Character images (Enzo1.png, zoe1.png, etc.)
│   └── index.html
├── src/
│   ├── components/       # Reusable components
│   │   ├── Navbar.js
│   │   ├── ProtectedRoute.js
│   │   └── PublicRoute.js
│   ├── contexts/         # React contexts
│   │   └── ToastContext.js
│   ├── pages/           # Main pages
│   │   ├── admin/       # Admin-specific pages
│   │   │   ├── AdminDashboard.js
│   │   │   ├── AdminLogin.js
│   │   │   ├── AddUser.js
│   │   │   ├── JanaDashboard.js
│   │   │   ├── ManageUsers.js
│   │   │   ├── ReceptionCalendar.js
│   │   │   └── Settings.js
│   │   ├── Home.js
│   │   ├── Menu.js
│   │   ├── Offers.js
│   │   ├── Booking.js
│   │   ├── Feedback.js
│   │   ├── FAQ.js
│   │   └── BirthdayPackages.js
│   ├── services/        # External services
│   │   └── emailService.js
│   ├── App.js          # Main application component
│   ├── firebase.js     # Firebase configuration
│   └── index.js        # Application entry point
└── package.json
```

## 🔐 User Roles & Permissions

### Manager (Jana) Role

- **Full System Access** - All administrative functions
- **Booking Management** - Approve/reject bookings with email notifications
- **Content Management** - Menu, packages, offers, and FAQ management
- **User Management** - Create and manage admin accounts
- **Feedback Moderation** - View and moderate customer feedback

### Reception Staff Role

- **Calendar Access** - View daily bookings and schedules
- **Booking Search** - Search and filter customer bookings
- **Limited Admin Access** - Reception-focused functionality

## 📧 Email Templates

The system uses EmailJS templates for:

### Booking Approval Email

- Confirms booking details
- Includes date, time, people count, and package information
- Professional styling with booking ID

### Booking Rejection Email

- Explains rejection reason
- Maintains professional tone
- Includes contact information for rebooking

## 🎨 Character System

### Enzo (Primary Mascot)

- Main character throughout the website
- Animated floating effects
- Multiple variants (Enzo1.png, Enzo2.png, Enzo3.png)

### Zoe (Secondary Mascot)

- Supporting character with complementary animations
- Appears in specific sections
- Multiple variants (zoe1.png, zoe2.png)

## 📱 Responsive Design

The website is fully responsive with:

- **Mobile-first approach** with optimized layouts
- **Tablet adaptations** with adjusted grid systems
- **Desktop enhancements** with full feature sets
- **Character visibility control** for performance optimization on mobile

## 🔧 Configuration

### Firebase Collections Structure

```
bookings/
├── id (auto-generated)
├── name (string)
├── email (string)
├── phone (string)
├── date (string)
├── time (string)
├── people (number)
├── status (string: "pending"|"approved"|"rejected")
├── type (string: "regular"|"birthday")
└── createdAt (timestamp)

menu/
├── id (auto-generated)
├── name (string)
└── image (string - URL)

feedback/
├── id (auto-generated)
├── name (string)
├── rating (number)
├── comment (string)
├── likes (number)
├── dislikes (number)
└── createdAt (timestamp)

birthdayPackages/
├── id (auto-generated)
├── title (string)
├── price (string)
├── items (array)
├── maxPeople (string)
└── duration (number)

offers/
├── id (auto-generated)
├── spend (number)
└── get (number)

faqs/
├── id (auto-generated)
├── question (string)
├── answer (string)
└── createdAt (timestamp)

admins/
├── id (auth UID)
├── name (string)
├── email (string)
├── role (string: "jana"|"reception")
├── createdAt (string)
└── createdBy (string)
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Firebase Hosting (Recommended)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Alternative Deployment Options

- **Netlify** - Drag and drop the build folder
- **Vercel** - Connect your repository for automatic deployments
- **GitHub Pages** - Use gh-pages package for GitHub hosting

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**

   - Verify firebaseConfig settings
   - Check Firebase project permissions
   - Ensure Firestore rules allow read/write

2. **Email Service Not Working**

   - Verify EmailJS service ID and template IDs
   - Check EmailJS account limits
   - Ensure email templates are published

3. **Image Upload Failures**

   - Verify Cloudinary upload preset
   - Check file size limits
   - Ensure proper CORS settings

4. **Authentication Issues**
   - Verify Firebase Auth configuration
   - Check user roles in Firestore
   - Ensure proper route protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer** - Full-stack development and design
- **Characters** - Enzo & Zoe (Mascot design and integration)

## 📞 Support

For support and questions:

- **Phone**: 0566164488
- **Email**: info@ignitearcade.com
- **Website**: [Your website URL]

## 🎯 Future Enhancements

- [ ] Mobile app development
- [ ] Online payment integration
- [ ] Real-time chat support
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Social media integration
- [ ] Loyalty card physical integration
- [ ] VR booking system integration

---

**Ignite Arcade** - Where Fun Meets Adventure! 🎳✨
