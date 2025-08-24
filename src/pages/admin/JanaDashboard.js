import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import "./JanaDashboard.css";
import { useToast } from "../../contexts/ToastContext";
import {
  sendApprovalEmail,
  sendRejectionEmail,
} from "../../services/emailService";
import { onAuthStateChanged } from "firebase/auth";
// Lane capacity constant
const MAX_LANES = 6;

// Lazy Image Component
const LazyImage = React.memo(({ src, alt, style, className }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageRef, setImageRef] = useState();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let observer;
    if (imageRef && imageSrc !== src) {
      if (IntersectionObserver) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && imageSrc !== src) {
                setImageSrc(src);
                observer.unobserve(imageRef);
              }
            });
          },
          { threshold: 0.1 }
        );
        observer.observe(imageRef);
      } else {
        // Fallback for older browsers
        setImageSrc(src);
      }
    }
    return () => {
      if (observer && observer.unobserve) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, src]);

  return (
    <div
      ref={setImageRef}
      className={`lazy-image-container ${className || ""}`}
      style={style}
    >
      {!isLoaded && (
        <div className="image-skeleton">
          <div className="skeleton-shimmer"></div>
        </div>
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          style={{
            ...style,
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
});

// Menu Item Card Component
const MenuItemCard = React.memo(({ item, onDelete }) => {
  return (
    <div className="menu-card">
      <div className="item-image">
        {item.image && item.image.startsWith("http") ? (
          <LazyImage
            src={item.image}
            alt={item.name}
            style={{
              width: "50px",
              height: "50px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
            className="menu-item-image"
          />
        ) : (
          <span>{item.image}</span>
        )}
      </div>
      <span className="item-name">{item.name}</span>
      <button onClick={() => onDelete(item.id)} className="delete">
        Delete
      </button>
    </div>
  );
});

// Lane Capacity Indicator Component
const LaneCapacityIndicator = ({ date, time, bookings }) => {
  const approvedBookings = bookings.filter(
    (b) => b.date === date && b.time === time && b.status === "approved"
  );

  const occupiedLanes = approvedBookings.length;
  const isAtCapacity = occupiedLanes >= MAX_LANES;

  return (
    <div className="lane-capacity-indicator">
      <div className="lane-info">
        <span className="lane-text">
          🎳 Lanes: {occupiedLanes}/{MAX_LANES}
        </span>
        {isAtCapacity && <span className="capacity-full">FULL</span>}
      </div>
      <div className="lane-visual">
        {Array.from({ length: MAX_LANES }, (_, index) => (
          <div
            key={index}
            className={`lane-dot ${
              index < occupiedLanes ? "occupied" : "available"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const JanaDashboard = () => {
  const { showSuccess, showError, showWarning, showConfirm } = useToast();
  const [activeTab, setActiveTab] = useState("bookings");
  const [userRole, setUserRole] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [birthdayPackages, setBirthdayPackages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingFilter, setBookingFilter] = useState("all"); // all, pending, approved, rejected

  // Form states
  const [newMenuItem, setNewMenuItem] = useState({ name: "", image: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newBirthdayPackage, setNewBirthdayPackage] = useState({
    title: "",
    price: "",
    items: [""],
    maxPeople: "",
    duration: "",
  });
  const [newOffer, setNewOffer] = useState({
    spend: "",
    get: "",
  });
  const [newFaq, setNewFaq] = useState({
    question: "",
    answer: "",
  });
  const [editingBooking, setEditingBooking] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [editPackageData, setEditPackageData] = useState({
    title: "",
    price: "",
    items: [""],
    maxPeople: "",
    duration: "",
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [bookingToReject, setBookingToReject] = useState(null);

  // Booking pagination states
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingsPerPage] = useState(10); // Adjustable bookings per page
  const [bookingSearchTerm, setBookingSearchTerm] = useState("");
  const [bookingSortBy, setBookingSortBy] = useState("newest"); // newest, oldest, name, date

  // Menu pagination states
  const [menuPage, setMenuPage] = useState(1);
  const [menuItemsPerPage] = useState(12); // Adjustable items per page
  const [menuSearchTerm, setMenuSearchTerm] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const menuListRef = useRef(null);

  useEffect(() => {
    fetchData();
    // Fetch user role
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
          if (adminDoc.exists()) {
            setUserRole(adminDoc.data().role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      const bookingsSnapshot = await getDocs(collection(db, "bookings"));
      setBookings(
        bookingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch menu items
      const menuSnapshot = await getDocs(collection(db, "menu"));
      setMenuItems(
        menuSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch feedback
      const feedbackSnapshot = await getDocs(
        query(collection(db, "feedback"), orderBy("createdAt", "desc"))
      );
      setFeedback(
        feedbackSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch birthday packages
      const birthdayPackagesSnapshot = await getDocs(
        collection(db, "birthdayPackages")
      );
      setBirthdayPackages(
        birthdayPackagesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );

      // Fetch offers
      const offersSnapshot = await getDocs(collection(db, "offers"));
      setOffers(
        offersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch FAQs
      const faqsSnapshot = await getDocs(collection(db, "faqs"));
      setFaqs(faqsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  // Helper function to get lane availability for a specific slot
  const getLaneAvailabilityForSlot = (date, time) => {
    const approvedBookings = bookings.filter(
      (b) => b.date === date && b.time === time && b.status === "approved"
    );

    return {
      occupied: approvedBookings.length,
      available: MAX_LANES - approvedBookings.length,
      total: MAX_LANES,
      isAtCapacity: approvedBookings.length >= MAX_LANES,
    };
  };

  // Booking management
  const updateBooking = async (bookingId, updates) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), updates);
      setBookings(
        bookings.map((booking) =>
          booking.id === bookingId ? { ...booking, ...updates } : booking
        )
      );
      setEditingBooking(null);
      showSuccess("Booking updated successfully!");
    } catch (error) {
      showError("Error updating booking: " + error.message);
    }
  };

  const cancelBooking = async (bookingId) => {
    const confirmed = await showConfirm({
      title: "Cancel Booking",
      message:
        "Are you sure you want to cancel this booking? This action cannot be undone.",
      confirmText: "Cancel Booking",
      cancelText: "Keep Booking",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "bookings", bookingId));
        setBookings(bookings.filter((booking) => booking.id !== bookingId));
        showSuccess("Booking cancelled successfully!");
      } catch (error) {
        showError("Error cancelling booking: " + error.message);
      }
    }
  };

  // Image upload to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Cloudinary configuration is missing. Please check your environment variables."
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Menu management
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setNewMenuItem({ ...newMenuItem, image: imageUrl });
    } catch (error) {
      showError("Error uploading image: " + error.message);
    }
    setUploadingImage(false);
  };

  const addMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.image) {
      showWarning("Please fill all fields and upload an image");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "menu"), newMenuItem);
      setMenuItems([...menuItems, { id: docRef.id, ...newMenuItem }]);
      setNewMenuItem({ name: "", image: "" });
      showSuccess("Menu item added successfully!");
    } catch (error) {
      showError("Error adding menu item: " + error.message);
    }
  };

  // Feedback management
  const deleteFeedback = async (feedbackId) => {
    const confirmed = await showConfirm({
      title: "Delete Feedback",
      message:
        "Are you sure you want to delete this feedback? This action cannot be undone.",
      confirmText: "Delete Feedback",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "feedback", feedbackId));
        setFeedback(feedback.filter((item) => item.id !== feedbackId));
        showSuccess("Feedback deleted successfully!");
      } catch (error) {
        showError("Error deleting feedback: " + error.message);
      }
    }
  };

  // Birthday package management
  const addBirthdayPackage = async () => {
    if (!newBirthdayPackage.title || !newBirthdayPackage.price) {
      showWarning("Please fill all required fields");
      return;
    }

    try {
      const packageData = {
        ...newBirthdayPackage,
        items: newBirthdayPackage.items.filter((item) => item.trim() !== ""),
        maxPeople: newBirthdayPackage.maxPeople, // Keep as string, don't parse to int
        duration: parseInt(newBirthdayPackage.duration),
      };
      const docRef = await addDoc(
        collection(db, "birthdayPackages"),
        packageData
      );
      setBirthdayPackages([
        ...birthdayPackages,
        { id: docRef.id, ...packageData },
      ]);
      setNewBirthdayPackage({
        title: "",
        price: "",
        items: [""],
        maxPeople: "",
        duration: "",
      });
      showSuccess("Birthday package added successfully!");
    } catch (error) {
      showError("Error adding birthday package: " + error.message);
    }
  };

  const deleteBirthdayPackage = async (packageId) => {
    const confirmed = await showConfirm({
      title: "Delete Birthday Package",
      message:
        "Are you sure you want to delete this birthday package? This action cannot be undone.",
      confirmText: "Delete Package",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "birthdayPackages", packageId));
        setBirthdayPackages(
          birthdayPackages.filter((pkg) => pkg.id !== packageId)
        );
        showSuccess("Birthday package deleted successfully!");
      } catch (error) {
        showError("Error deleting birthday package: " + error.message);
      }
    }
  };

  const startEditingPackage = (pkg) => {
    setEditingPackage(pkg.id);
    setEditPackageData({
      title: pkg.title,
      price: pkg.price,
      items: [...pkg.items],
      maxPeople: pkg.maxPeople,
      duration: pkg.duration,
    });
  };

  const updateBirthdayPackage = async () => {
    if (!editPackageData.title || !editPackageData.price) {
      showWarning("Please fill all required fields");
      return;
    }

    try {
      const packageData = {
        ...editPackageData,
        items: editPackageData.items.filter((item) => item.trim() !== ""),
        maxPeople: editPackageData.maxPeople, // Keep as string, don't parse to int
        duration: parseInt(editPackageData.duration),
      };

      await updateDoc(doc(db, "birthdayPackages", editingPackage), packageData);

      setBirthdayPackages(
        birthdayPackages.map((pkg) =>
          pkg.id === editingPackage
            ? { id: editingPackage, ...packageData }
            : pkg
        )
      );

      setEditingPackage(null);
      setEditPackageData({
        title: "",
        price: "",
        items: [""],
        maxPeople: "",
        duration: "",
      });

      showSuccess("Birthday package updated successfully!");
    } catch (error) {
      showError("Error updating birthday package: " + error.message);
    }
  };

  const cancelEditingPackage = () => {
    setEditingPackage(null);
    setEditPackageData({
      title: "",
      price: "",
      items: [""],
      maxPeople: "",
      duration: "",
    });
  };

  // Offers management
  const addOffer = async () => {
    if (!newOffer.spend || !newOffer.get) {
      showWarning("Please fill all required fields");
      return;
    }

    if (parseInt(newOffer.spend) <= 0 || parseInt(newOffer.get) <= 0) {
      showWarning("Please enter valid positive numbers");
      return;
    }

    try {
      const offerData = {
        spend: parseInt(newOffer.spend),
        get: parseInt(newOffer.get),
      };
      const docRef = await addDoc(collection(db, "offers"), offerData);
      setOffers([...offers, { id: docRef.id, ...offerData }]);
      setNewOffer({ spend: "", get: "" });
      showSuccess("Offer added successfully!");
    } catch (error) {
      showError("Error adding offer: " + error.message);
    }
  };

  const deleteOffer = async (offerId) => {
    const confirmed = await showConfirm({
      title: "Delete Offer",
      message:
        "Are you sure you want to delete this offer? This action cannot be undone.",
      confirmText: "Delete Offer",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "offers", offerId));
        setOffers(offers.filter((offer) => offer.id !== offerId));
        showSuccess("Offer deleted successfully!");
      } catch (error) {
        showError("Error deleting offer: " + error.message);
      }
    }
  };

  // FAQ management
  const addFaq = async () => {
    if (!newFaq.question || !newFaq.answer) {
      showWarning("Please fill all required fields");
      return;
    }

    try {
      const faqData = {
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim(),
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, "faqs"), faqData);
      setFaqs([...faqs, { id: docRef.id, ...faqData }]);
      setNewFaq({ question: "", answer: "" });
      showSuccess("FAQ added successfully!");
    } catch (error) {
      showError("Error adding FAQ: " + error.message);
    }
  };

  const deleteFaq = async (faqId) => {
    const confirmed = await showConfirm({
      title: "Delete FAQ",
      message:
        "Are you sure you want to delete this FAQ? This action cannot be undone.",
      confirmText: "Delete FAQ",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        await deleteDoc(doc(db, "faqs", faqId));
        setFaqs(faqs.filter((faq) => faq.id !== faqId));
        showSuccess("FAQ deleted successfully!");
      } catch (error) {
        showError("Error deleting FAQ: " + error.message);
      }
    }
  };

  // Booking approval functions with lane capacity validation
  const approveBooking = async (bookingId) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);

      // Check lane capacity before approving
      const approvedBookingsForSameSlot = bookings.filter(
        (b) =>
          b.date === booking.date &&
          b.time === booking.time &&
          b.status === "approved" &&
          b.id !== bookingId // Exclude current booking
      );

      if (approvedBookingsForSameSlot.length >= MAX_LANES) {
        showError(
          `Cannot approve booking: All ${MAX_LANES} lanes are already booked for ${booking.date} at ${booking.time}. ` +
            `Currently approved: ${approvedBookingsForSameSlot.length}/${MAX_LANES} lanes.`
        );
        return;
      }

      // Show confirmation with lane capacity info
      const remainingLanes = MAX_LANES - approvedBookingsForSameSlot.length;
      const confirmed = await showConfirm({
        title: "Approve Booking",
        message:
          `Are you sure you want to approve this booking?\n\n` +
          `📅 Date: ${booking.date}\n` +
          `⏰ Time: ${booking.time}\n` +
          `👥 Customer: ${booking.name}\n` +
          `🎳 Lanes currently approved for this slot: ${approvedBookingsForSameSlot.length}/${MAX_LANES}\n` +
          `🎳 Lanes remaining after approval: ${
            remainingLanes - 1
          }/${MAX_LANES}\n\n` +
          `The customer will be notified via email.`,
        confirmText: "Approve & Send Email",
        cancelText: "Cancel",
        type: "info",
      });

      if (confirmed) {
        // Check if booking has email
        if (!booking.email || booking.email.trim() === "") {
          showWarning(
            "This booking doesn't have an email address. Approving without sending email."
          );
        }

        await updateDoc(doc(db, "bookings", bookingId), {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: "admin",
        });

        setBookings(
          bookings.map((b) =>
            b.id === bookingId
              ? { ...b, status: "approved", approvedAt: new Date() }
              : b
          )
        );

        // Send approval email only if email exists
        if (booking.email && booking.email.trim() !== "") {
          console.log("Attempting to send approval email to:", booking.email);
          const emailResult = await sendApprovalEmail(booking);
          if (emailResult.success) {
            showSuccess(
              `Booking approved and confirmation email sent! ` +
                `Lane ${
                  approvedBookingsForSameSlot.length + 1
                }/${MAX_LANES} assigned for ${booking.date} at ${booking.time}.`
            );
          } else {
            console.error("Email sending failed:", emailResult.error);
            showWarning(
              `Booking approved but email failed to send: ${emailResult.error}`
            );
          }
        } else {
          showSuccess(
            `Booking approved! (No email on file) ` +
              `Lane ${
                approvedBookingsForSameSlot.length + 1
              }/${MAX_LANES} assigned for ${booking.date} at ${booking.time}.`
          );
        }
      }
    } catch (error) {
      showError("Error approving booking: " + error.message);
    }
  };

  const startRejectBooking = (bookingId) => {
    setBookingToReject(bookingId);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const confirmRejectBooking = async () => {
    if (!bookingToReject) return;

    try {
      const booking = bookings.find((b) => b.id === bookingToReject);

      // Check if booking has email
      if (!booking.email || booking.email.trim() === "") {
        showWarning(
          "This booking doesn't have an email address. Rejecting without sending email."
        );
      }

      await updateDoc(doc(db, "bookings", bookingToReject), {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: "admin",
        rejectionReason: rejectionReason,
      });

      setBookings(
        bookings.map((booking) =>
          booking.id === bookingToReject
            ? {
                ...booking,
                status: "rejected",
                rejectedAt: new Date(),
                rejectionReason: rejectionReason,
              }
            : booking
        )
      );

      // Send rejection email only if email exists
      if (booking.email && booking.email.trim() !== "") {
        console.log("Attempting to send rejection email to:", booking.email); // Debug log
        const emailResult = await sendRejectionEmail(booking, rejectionReason);
        if (emailResult.success) {
          showSuccess("Booking rejected and notification email sent!");
        } else {
          console.error("Email sending failed:", emailResult.error); // Debug log
          showWarning(
            `Booking rejected but email failed to send: ${emailResult.error}`
          );
        }
      } else {
        showSuccess("Booking rejected! (No email on file)");
      }

      setShowRejectionModal(false);
      setBookingToReject(null);
      setRejectionReason("");
    } catch (error) {
      showError("Error rejecting booking: " + error.message);
    }
  };

  const cancelRejectBooking = () => {
    setShowRejectionModal(false);
    setBookingToReject(null);
    setRejectionReason("");
  };

  const addContactAttempt = async (bookingId) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      const newAttempts = (booking.contactAttempts || 0) + 1;

      await updateDoc(doc(db, "bookings", bookingId), {
        contactAttempts: newAttempts,
        lastContactAttempt: new Date(),
      });

      setBookings(
        bookings.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                contactAttempts: newAttempts,
                lastContactAttempt: new Date(),
              }
            : booking
        )
      );

      showSuccess(`Contact attempt #${newAttempts} recorded`);
    } catch (error) {
      showError("Error recording contact attempt: " + error.message);
    }
  };

  // Filter bookings based on status
  const getFilteredBookings = () => {
    if (bookingFilter === "all") return bookings;
    return bookings.filter((booking) => booking.status === bookingFilter);
  };

  // Enhanced booking filtering and sorting
  const getFilteredAndSortedBookings = () => {
    let filtered = getFilteredBookings();

    // Apply search filter
    if (bookingSearchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.name
            .toLowerCase()
            .includes(bookingSearchTerm.toLowerCase()) ||
          booking.phone.includes(bookingSearchTerm) ||
          booking.email
            ?.toLowerCase()
            .includes(bookingSearchTerm.toLowerCase()) ||
          booking.date.includes(bookingSearchTerm)
      );
    }

    // Apply sorting
    switch (bookingSortBy) {
      case "newest":
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
        break;
      case "oldest":
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateA - dateB;
        });
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "date":
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      default:
        break;
    }

    return filtered;
  };

  // Paginated bookings
  const getPaginatedBookings = () => {
    const filtered = getFilteredAndSortedBookings();
    const startIndex = (bookingPage - 1) * bookingsPerPage;
    const endIndex = startIndex + bookingsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Booking pagination info
  const getBookingPaginationInfo = () => {
    const totalBookings = getFilteredAndSortedBookings().length;
    const totalPages = Math.ceil(totalBookings / bookingsPerPage);
    const startIndex = (bookingPage - 1) * bookingsPerPage + 1;
    const endIndex = Math.min(bookingPage * bookingsPerPage, totalBookings);

    return {
      totalBookings,
      totalPages,
      currentPage: bookingPage,
      startIndex,
      endIndex,
      hasNextPage: bookingPage < totalPages,
      hasPrevPage: bookingPage > 1,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "approved":
        return "#22c55e";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      default:
        return "❓";
    }
  };

  // Memoized filtered and paginated menu items
  const filteredMenuItems = useMemo(() => {
    if (!menuSearchTerm) return menuItems;
    return menuItems.filter((item) =>
      item.name.toLowerCase().includes(menuSearchTerm.toLowerCase())
    );
  }, [menuItems, menuSearchTerm]);

  const paginatedMenuItems = useMemo(() => {
    const startIndex = 0;
    const endIndex = menuPage * menuItemsPerPage;
    return filteredMenuItems.slice(startIndex, endIndex);
  }, [filteredMenuItems, menuPage, menuItemsPerPage]);

  const hasMoreMenuItems = useMemo(() => {
    return paginatedMenuItems.length < filteredMenuItems.length;
  }, [paginatedMenuItems.length, filteredMenuItems.length]);

  // Load more items function
  const loadMoreMenuItems = useCallback(() => {
    if (!isLoadingMore && hasMoreMenuItems) {
      setIsLoadingMore(true);
      // Simulate loading delay for better UX
      setTimeout(() => {
        setMenuPage((prev) => prev + 1);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [isLoadingMore, hasMoreMenuItems]);

  // Scroll handler for infinite scroll
  const handleMenuScroll = useCallback(
    (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        // Load when 1.5 screens from bottom
        loadMoreMenuItems();
      }
    },
    [loadMoreMenuItems]
  );

  // Optimized delete function
  const deleteMenuItem = useCallback(
    async (itemId) => {
      const confirmed = await showConfirm({
        title: "Delete Menu Item",
        message:
          "Are you sure you want to delete this menu item? This action cannot be undone.",
        confirmText: "Delete Item",
        cancelText: "Cancel",
        type: "danger",
      });

      if (confirmed) {
        try {
          await deleteDoc(doc(db, "menu", itemId));
          setMenuItems((prevItems) =>
            prevItems.filter((item) => item.id !== itemId)
          );
          showSuccess("Menu item deleted successfully!");
        } catch (error) {
          showError("Error deleting menu item: " + error.message);
        }
      }
    },
    [showConfirm, showSuccess, showError]
  );

  // Reset pagination when search changes
  useEffect(() => {
    setMenuPage(1);
  }, [menuSearchTerm]);

  // Reset booking pagination when filters change
  useEffect(() => {
    setBookingPage(1);
  }, [bookingFilter, bookingSearchTerm, bookingSortBy]);

  return (
    <div className="jana-dashboard">
      <div className="container">
        <h1>
          {userRole === "reception"
            ? "Bookings Management"
            : "Jana's Management Dashboard"}
        </h1>

        <div className="tab-navigation">
          <button
            className={activeTab === "bookings" ? "active" : ""}
            onClick={() => setActiveTab("bookings")}
          >
            📅 Manage Bookings
          </button>
          {userRole === "jana" && (
            <>
              <button
                className={activeTab === "menu" ? "active" : ""}
                onClick={() => setActiveTab("menu")}
              >
                🍽️ Manage Menu
              </button>
              <button
                className={activeTab === "feedback" ? "active" : ""}
                onClick={() => setActiveTab("feedback")}
              >
                💬 Manage Feedback
              </button>
              <button
                className={activeTab === "birthday" ? "active" : ""}
                onClick={() => setActiveTab("birthday")}
              >
                🎉 Manage Birthday Packages
              </button>
              <button
                className={activeTab === "offers" ? "active" : ""}
                onClick={() => setActiveTab("offers")}
              >
                💰 Manage Offers
              </button>
              <button
                className={activeTab === "faqs" ? "active" : ""}
                onClick={() => setActiveTab("faqs")}
              >
                ❓ Manage FAQs
              </button>
            </>
          )}
        </div>

        {loading && <div className="loading">Loading...</div>}

        {/* Bookings Management */}
        {activeTab === "bookings" && (
          <div className="tab-content">
            <div className="bookings-header">
              <h2>Manage Bookings</h2>
              <div className="booking-filters">
                <button
                  className={`filter-btn ${
                    bookingFilter === "all" ? "active" : ""
                  }`}
                  onClick={() => setBookingFilter("all")}
                >
                  All ({bookings.length})
                </button>
                <button
                  className={`filter-btn ${
                    bookingFilter === "pending" ? "active" : ""
                  }`}
                  onClick={() => setBookingFilter("pending")}
                >
                  Pending (
                  {bookings.filter((b) => b.status === "pending").length})
                </button>
                <button
                  className={`filter-btn ${
                    bookingFilter === "approved" ? "active" : ""
                  }`}
                  onClick={() => setBookingFilter("approved")}
                >
                  Approved (
                  {bookings.filter((b) => b.status === "approved").length})
                </button>
                <button
                  className={`filter-btn ${
                    bookingFilter === "rejected" ? "active" : ""
                  }`}
                  onClick={() => setBookingFilter("rejected")}
                >
                  Rejected (
                  {bookings.filter((b) => b.status === "rejected").length})
                </button>
              </div>
            </div>

            {/* Search and Sort Controls */}
            <div className="booking-controls">
              <div className="booking-search-container">
                <input
                  type="text"
                  placeholder="🔍 Search by name, phone, email, or date..."
                  value={bookingSearchTerm}
                  onChange={(e) => setBookingSearchTerm(e.target.value)}
                  className="booking-search-input"
                />
                {bookingSearchTerm && (
                  <button
                    onClick={() => setBookingSearchTerm("")}
                    className="clear-search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="booking-sort-container">
                <label>Sort by:</label>
                <select
                  value={bookingSortBy}
                  onChange={(e) => setBookingSortBy(e.target.value)}
                  className="booking-sort-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="date">Booking Date</option>
                </select>
              </div>
            </div>

            {/* Pagination Info */}
            {(() => {
              const paginationInfo = getBookingPaginationInfo();
              return (
                <div className="booking-pagination-info">
                  <span>
                    Showing {paginationInfo.startIndex}-
                    {paginationInfo.endIndex} of {paginationInfo.totalBookings}{" "}
                    bookings
                  </span>
                  {paginationInfo.totalPages > 1 && (
                    <span>
                      Page {paginationInfo.currentPage} of{" "}
                      {paginationInfo.totalPages}
                    </span>
                  )}
                </div>
              );
            })()}

            <div className="bookings-list">
              {getPaginatedBookings().map((booking) => (
                <div key={booking.id} className="booking-card">
                  {editingBooking === booking.id ? (
                    <div className="edit-form">
                      <input
                        type="date"
                        defaultValue={
                          new Date(booking.date).toISOString().split("T")[0]
                        }
                        onChange={(e) => (booking.newDate = e.target.value)}
                      />
                      <input
                        type="time"
                        defaultValue={booking.time}
                        onChange={(e) => (booking.newTime = e.target.value)}
                      />
                      <button
                        onClick={() =>
                          updateBooking(booking.id, {
                            date: booking.newDate || booking.date,
                            time: booking.newTime || booking.time,
                          })
                        }
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingBooking(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="booking-info">
                      <div className="booking-status-header">
                        <div
                          className="booking-status"
                          style={{ color: getStatusColor(booking.status) }}
                        >
                          {getStatusIcon(booking.status)}{" "}
                          {booking.status?.toUpperCase() || "PENDING"}
                        </div>
                        <div className="booking-date-created">
                          Created:{" "}
                          {booking.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString() || "N/A"}
                        </div>
                      </div>

                      <h3>{booking.name}</h3>
                      <p>
                        📅 {booking.date} at {booking.time}
                      </p>
                      <p>
                        👥 {booking.people} people | 🎳 {booking.rounds} rounds
                      </p>
                      <p>📞 {booking.phone}</p>
                      {booking.email && <p>📧 {booking.email}</p>}

                      {/* Lane Capacity Indicator */}
                      <LaneCapacityIndicator
                        date={booking.date}
                        time={booking.time}
                        bookings={bookings}
                      />

                      {booking.type === "birthday" && booking.bundleName && (
                        <p>🎉 Package: {booking.bundleName}</p>
                      )}

                      {booking.contactAttempts > 0 && (
                        <p className="contact-attempts">
                          📞 Contact attempts: {booking.contactAttempts}
                        </p>
                      )}

                      <div className="booking-actions">
                        {booking.status === "pending" && (
                          <>
                            <button
                              onClick={() => addContactAttempt(booking.id)}
                              className="contact-btn"
                            >
                              Mark Contact Attempt
                            </button>
                            <button
                              onClick={() => approveBooking(booking.id)}
                              className="approve-btn"
                              disabled={
                                getLaneAvailabilityForSlot(
                                  booking.date,
                                  booking.time
                                ).isAtCapacity
                              }
                            >
                              {getLaneAvailabilityForSlot(
                                booking.date,
                                booking.time
                              ).isAtCapacity
                                ? "Lanes Full"
                                : "Approve & Email"}
                            </button>
                            <button
                              onClick={() => startRejectBooking(booking.id)}
                              className="reject-btn"
                            >
                              Reject & Email
                            </button>
                          </>
                        )}

                        {booking.status === "approved" && (
                          <button onClick={() => setEditingBooking(booking.id)}>
                            Edit
                          </button>
                        )}

                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="cancel"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {(() => {
              const paginationInfo = getBookingPaginationInfo();
              if (paginationInfo.totalPages <= 1) return null;

              return (
                <div className="booking-pagination">
                  <button
                    onClick={() => setBookingPage(1)}
                    disabled={!paginationInfo.hasPrevPage}
                    className="pagination-btn"
                  >
                    ⟪ First
                  </button>

                  <button
                    onClick={() => setBookingPage(bookingPage - 1)}
                    disabled={!paginationInfo.hasPrevPage}
                    className="pagination-btn"
                  >
                    ‹ Previous
                  </button>

                  <div className="pagination-pages">
                    {Array.from(
                      { length: Math.min(5, paginationInfo.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (paginationInfo.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (paginationInfo.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (
                          paginationInfo.currentPage >=
                          paginationInfo.totalPages - 2
                        ) {
                          pageNum = paginationInfo.totalPages - 4 + i;
                        } else {
                          pageNum = paginationInfo.currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setBookingPage(pageNum)}
                            className={`pagination-btn ${
                              pageNum === paginationInfo.currentPage
                                ? "active"
                                : ""
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={() => setBookingPage(bookingPage + 1)}
                    disabled={!paginationInfo.hasNextPage}
                    className="pagination-btn"
                  >
                    Next ›
                  </button>

                  <button
                    onClick={() => setBookingPage(paginationInfo.totalPages)}
                    disabled={!paginationInfo.hasNextPage}
                    className="pagination-btn"
                  >
                    Last ⟫
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Menu Management - Only for Jana */}
        {activeTab === "menu" && userRole === "jana" && (
          <div className="tab-content">
            <h2>Manage Menu</h2>

            <div className="add-form">
              <h3>Add New Menu Item</h3>
              <input
                type="text"
                placeholder="Item Name"
                value={newMenuItem.name}
                onChange={(e) =>
                  setNewMenuItem({ ...newMenuItem, name: e.target.value })
                }
              />
              <div className="image-upload-section">
                <label>Upload Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p>Uploading image...</p>}
                {newMenuItem.image && (
                  <div className="image-preview">
                    <img
                      src={newMenuItem.image}
                      alt="Preview"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
              </div>
              <button onClick={addMenuItem} disabled={uploadingImage}>
                {uploadingImage ? "Uploading..." : "Add Item"}
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="menu-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="🔍 Search menu items..."
                  value={menuSearchTerm}
                  onChange={(e) => setMenuSearchTerm(e.target.value)}
                  className="search-input"
                />
                {menuSearchTerm && (
                  <button
                    onClick={() => setMenuSearchTerm("")}
                    className="clear-search"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="menu-stats">
                Showing {paginatedMenuItems.length} of{" "}
                {filteredMenuItems.length} items
              </div>
            </div>

            {/* Menu List with Virtual Scrolling */}
            <div
              className="menu-list-container"
              ref={menuListRef}
              onScroll={handleMenuScroll}
            >
              <div className="menu-list">
                {paginatedMenuItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onDelete={deleteMenuItem}
                  />
                ))}
              </div>

              {/* Loading More Indicator */}
              {isLoadingMore && (
                <div className="loading-more">
                  <div className="loading-spinner"></div>
                  <span>Loading more items...</span>
                </div>
              )}

              {/* Load More Button (fallback for non-infinite scroll) */}
              {!isLoadingMore && hasMoreMenuItems && (
                <div className="load-more-container">
                  <button onClick={loadMoreMenuItems} className="load-more-btn">
                    Load More Items (
                    {filteredMenuItems.length - paginatedMenuItems.length}{" "}
                    remaining)
                  </button>
                </div>
              )}

              {/* No Items State */}
              {filteredMenuItems.length === 0 && !loading && (
                <div className="no-items-state">
                  <div className="no-items-icon">🍽️</div>
                  <h3>No menu items found</h3>
                  <p>
                    {menuSearchTerm
                      ? `No items match "${menuSearchTerm}"`
                      : "Start by adding your first menu item!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Management - Only for Jana */}
        {activeTab === "feedback" && userRole === "jana" && (
          <div className="tab-content">
            <h2>Manage Feedback</h2>
            <div className="feedback-list">
              {feedback.map((item) => (
                <div key={item.id} className="feedback-card">
                  <div className="feedback-header">
                    <strong>{item.name}</strong>
                    <span>{"⭐".repeat(item.rating)}</span>
                    <button
                      onClick={() => deleteFeedback(item.id)}
                      className="delete"
                    >
                      Delete
                    </button>
                  </div>
                  <p>{item.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Birthday Packages Management - Only for Jana */}
        {activeTab === "birthday" && userRole === "jana" && (
          <div className="tab-content">
            <h2>Manage Birthday Packages</h2>

            <div className="add-form">
              <h3>Add New Birthday Package</h3>
              <input
                type="text"
                placeholder="Package Title (e.g., ✨ Spark Package)"
                value={newBirthdayPackage.title}
                onChange={(e) =>
                  setNewBirthdayPackage({
                    ...newBirthdayPackage,
                    title: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Price (e.g., 80 ILS/person)"
                value={newBirthdayPackage.price}
                onChange={(e) =>
                  setNewBirthdayPackage({
                    ...newBirthdayPackage,
                    price: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Max People"
                value={newBirthdayPackage.maxPeople}
                onChange={(e) =>
                  setNewBirthdayPackage({
                    ...newBirthdayPackage,
                    maxPeople: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Duration in minutes"
                value={newBirthdayPackage.duration}
                onChange={(e) =>
                  setNewBirthdayPackage({
                    ...newBirthdayPackage,
                    duration: e.target.value,
                  })
                }
              />

              <div className="items-section">
                <label>Package Items:</label>
                {newBirthdayPackage.items.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder="Package item (e.g., 1 VR session)"
                    value={item}
                    onChange={(e) => {
                      const items = [...newBirthdayPackage.items];
                      items[index] = e.target.value;
                      setNewBirthdayPackage({ ...newBirthdayPackage, items });
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setNewBirthdayPackage({
                      ...newBirthdayPackage,
                      items: [...newBirthdayPackage.items, ""],
                    })
                  }
                >
                  + Add Item
                </button>
              </div>

              <button onClick={addBirthdayPackage}>Add Birthday Package</button>
            </div>

            <div className="packages-list">
              {birthdayPackages.map((pkg) => (
                <div key={pkg.id} className="package-card">
                  {editingPackage === pkg.id ? (
                    <div className="edit-package-form">
                      <input
                        type="text"
                        placeholder="Package Title"
                        value={editPackageData.title}
                        onChange={(e) =>
                          setEditPackageData({
                            ...editPackageData,
                            title: e.target.value,
                          })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Price"
                        value={editPackageData.price}
                        onChange={(e) =>
                          setEditPackageData({
                            ...editPackageData,
                            price: e.target.value,
                          })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Max People"
                        value={editPackageData.maxPeople}
                        onChange={(e) =>
                          setEditPackageData({
                            ...editPackageData,
                            maxPeople: e.target.value,
                          })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Duration in minutes"
                        value={editPackageData.duration}
                        onChange={(e) =>
                          setEditPackageData({
                            ...editPackageData,
                            duration: e.target.value,
                          })
                        }
                      />

                      <div className="edit-items-section">
                        <label>Package Items:</label>
                        {editPackageData.items.map((item, index) => (
                          <input
                            key={index}
                            type="text"
                            placeholder="Package item"
                            value={item}
                            onChange={(e) => {
                              const items = [...editPackageData.items];
                              items[index] = e.target.value;
                              setEditPackageData({ ...editPackageData, items });
                            }}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setEditPackageData({
                              ...editPackageData,
                              items: [...editPackageData.items, ""],
                            })
                          }
                        >
                          + Add Item
                        </button>
                      </div>

                      <div className="edit-package-actions">
                        <button onClick={updateBirthdayPackage}>Save</button>
                        <button onClick={cancelEditingPackage}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{pkg.title}</h3>
                      <p className="price">{pkg.price}</p>
                      <p className="package-details">
                        👥 Max: {pkg.maxPeople} people | ⏱️ Duration:{" "}
                        {pkg.duration} minutes
                      </p>
                      <ul>
                        {pkg.items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                      <div className="package-actions">
                        <button
                          onClick={() => startEditingPackage(pkg)}
                          className="edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteBirthdayPackage(pkg.id)}
                          className="delete"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offers Management - Only for Jana */}
        {activeTab === "offers" && userRole === "jana" && (
          <div className="tab-content">
            <h2>Manage Points Offers</h2>

            <div className="add-form">
              <h3>Add New Offer</h3>
              <div className="offer-input-group">
                <input
                  type="number"
                  placeholder="Spend Amount (ILS)"
                  value={newOffer.spend}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, spend: e.target.value })
                  }
                  min="1"
                />
                <span className="arrow-text">&rarr;</span>
                <input
                  type="number"
                  placeholder="Points to Get"
                  value={newOffer.get}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, get: e.target.value })
                  }
                  min="1"
                />
              </div>
              <button onClick={addOffer}>Add Offer</button>
            </div>

            <div className="offers-list">
              {offers
                .sort((a, b) => a.spend - b.spend)
                .map((offer) => (
                  <div key={offer.id} className="offer-card">
                    <div className="offer-display">
                      <div className="spend-section">
                        <span className="currency">&#8362;</span>
                        <span className="amount">{offer.spend}</span>
                        <span className="label">Spend</span>
                      </div>
                      <div className="arrow-section">
                        <span>&rarr;</span>
                      </div>
                      <div className="get-section">
                        <span className="points">{offer.get}</span>
                        <span className="label">Points</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="delete"
                    >
                      Delete
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* FAQs Management - Only for Jana */}
        {activeTab === "faqs" && userRole === "jana" && (
          <div className="tab-content">
            <h2>Manage Frequently Asked Questions</h2>

            <div className="add-form">
              <h3>Add New FAQ</h3>
              <input
                type="text"
                placeholder="Question"
                value={newFaq.question}
                onChange={(e) =>
                  setNewFaq({ ...newFaq, question: e.target.value })
                }
              />
              <textarea
                placeholder="Answer"
                value={newFaq.answer}
                onChange={(e) =>
                  setNewFaq({ ...newFaq, answer: e.target.value })
                }
                rows="4"
              />
              <button onClick={addFaq}>Add FAQ</button>
            </div>

            <div className="faqs-list">
              {faqs.map((faq) => (
                <div key={faq.id} className="faq-card">
                  <div className="faq-question">
                    <h4>❓ {faq.question}</h4>
                  </div>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                  <button onClick={() => deleteFaq(faq.id)} className="delete">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="rejection-modal-overlay" onClick={cancelRejectBooking}>
          <div className="rejection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rejection-modal-header">
              <h3>Reject Booking</h3>
            </div>

            <div className="rejection-modal-body">
              <p>
                Please provide a reason for rejecting this booking. This will be
                included in the email to the customer.
              </p>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason (e.g., 'The requested time slot is no longer available', 'Capacity is full for that date', etc.)"
                rows="4"
                className="rejection-reason-input"
              />

              <div className="rejection-reason-suggestions">
                <p>
                  <strong>Common reasons:</strong>
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason(
                      "The requested time slot is no longer available."
                    )
                  }
                  className="suggestion-btn"
                >
                  Time slot unavailable
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason(
                      "We are at full capacity for the requested date."
                    )
                  }
                  className="suggestion-btn"
                >
                  Full capacity
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason(
                      "Unable to accommodate the requested party size."
                    )
                  }
                  className="suggestion-btn"
                >
                  Party size issue
                </button>
              </div>
            </div>

            <div className="rejection-modal-actions">
              <button onClick={cancelRejectBooking} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={confirmRejectBooking}
                className="confirm-reject-btn"
                disabled={!rejectionReason.trim()}
              >
                Reject & Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced styles including lane capacity validation */}
      <style jsx>{`
        .bookings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .booking-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .filter-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .filter-btn:hover:not(.active) {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .booking-status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .booking-status {
          font-weight: bold;
          font-size: 14px;
        }

        .booking-date-created {
          font-size: 12px;
          color: #6b7280;
        }

        .contact-attempts {
          color: #f59e0b;
          font-weight: 500;
        }

        .booking-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .approve-btn {
          background: #22c55e;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .approve-btn:hover:not(:disabled) {
          background: #16a34a;
        }

        .approve-btn:disabled {
          background: #9ca3af !important;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .approve-btn:disabled:hover {
          background: #9ca3af !important;
          transform: none;
        }

        .reject-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .reject-btn:hover {
          background: #dc2626;
        }

        .contact-btn {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .contact-btn:hover {
          background: #d97706;
        }

        .lane-capacity-indicator {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
          margin: 8px 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .lane-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .lane-text {
          font-size: 14px;
          font-weight: 500;
        }

        .capacity-full {
          background: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .lane-visual {
          display: flex;
          gap: 4px;
        }

        .lane-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .lane-dot.occupied {
          background: #ef4444;
          box-shadow: 0 0 4px rgba(239, 68, 68, 0.5);
        }

        .lane-dot.available {
          background: #22c55e;
          box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
        }

        .rejection-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10002;
        }

        .rejection-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideIn 0.3s ease-out;
        }

        .rejection-modal-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .rejection-modal-header h3 {
          margin: 0;
          color: #ef4444;
        }

        .rejection-modal-body {
          padding: 24px;
        }

        .rejection-modal-body p {
          margin-bottom: 16px;
          color: #6b7280;
          line-height: 1.5;
        }

        .rejection-reason-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 16px;
        }

        .rejection-reason-input:focus {
          outline: none;
          border-color: #ef4444;
        }

        .rejection-reason-suggestions {
          margin-bottom: 16px;
        }

        .rejection-reason-suggestions p {
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .suggestion-btn {
          display: inline-block;
          margin: 4px 8px 4px 0;
          padding: 6px 12px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-btn:hover {
          background: #e5e7eb;
        }

        .rejection-modal-actions {
          padding: 16px 24px 24px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-btn {
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
        }

        .confirm-reject-btn {
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .confirm-reject-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .confirm-reject-btn:hover:not(:disabled) {
          background: #dc2626;
        }

        .booking-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .booking-search-container {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .booking-search-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid rgba(255, 127, 0, 0.3);
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .booking-search-input:focus {
          outline: none;
          border-color: var(--aurora-orange);
          box-shadow: 0 0 0 4px rgba(255, 127, 0, 0.1);
        }

        .booking-sort-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .booking-sort-container label {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
        }

        .booking-sort-select {
          padding: 8px 12px;
          border: 2px solid rgba(255, 127, 0, 0.3);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
        }

        .booking-sort-select:focus {
          outline: none;
          border-color: var(--aurora-orange);
        }

        .booking-pagination-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .booking-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pagination-btn {
          padding: 8px 12px;
          border: 2px solid rgba(255, 127, 0, 0.3);
          background: rgba(255, 255, 255, 0.9);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-family: inherit;
          min-width: 40px;
        }

        .pagination-btn:hover:not(:disabled) {
          background: rgba(255, 127, 0, 0.1);
          border-color: var(--aurora-orange);
          color: var(--aurora-orange);
        }

        .pagination-btn.active {
          background: var(--aurora-orange);
          color: white;
          border-color: var(--aurora-orange);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.5);
        }

        .pagination-pages {
          display: flex;
          gap: 4px;
        }

        .menu-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-container {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid rgba(255, 127, 0, 0.3);
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--aurora-orange);
          box-shadow: 0 0 0 4px rgba(255, 127, 0, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #666;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .clear-search:hover {
          background: rgba(255, 127, 0, 0.1);
          color: var(--aurora-orange);
        }

        .menu-stats {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .menu-list-container {
          max-height: 70vh;
          overflow-y: auto;
          padding-right: 8px;
          scroll-behavior: smooth;
        }

        .menu-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .lazy-image-container {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }

        .image-skeleton {
          width: 50px;
          height: 50px;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }

        .skeleton-shimmer {
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 25%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .loading-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 127, 0, 0.3);
          border-top: 2px solid var(--aurora-orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .load-more-container {
          display: flex;
          justify-content: center;
          padding: 2rem;
        }

        .load-more-btn {
          background: var(--gradient-stellar);
          color: white;
          border: none;
          border-radius: 25px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .load-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(74, 159, 255, 0.3);
        }

        .no-items-state {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .no-items-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-items-state h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: white;
        }

        .no-items-state p {
          font-size: 1rem;
          opacity: 0.8;
        }

        /* Optimize for mobile */
        @media (max-width: 768px) {
          .menu-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-container {
            max-width: none;
          }

          .menu-list {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
          }

          .menu-list-container {
            max-height: 60vh;
          }

          .bookings-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .booking-filters {
            justify-content: center;
          }

          .booking-actions {
            flex-direction: column;
            gap: 6px;
          }

          .lane-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .booking-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .booking-search-container {
            max-width: none;
          }

          .booking-sort-container {
            justify-content: space-between;
          }

          .booking-pagination {
            flex-wrap: wrap;
            gap: 4px;
          }

          .pagination-btn {
            font-size: 12px;
            padding: 6px 10px;
            min-width: 35px;
          }

          .booking-pagination-info {
            flex-direction: column;
            gap: 4px;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .menu-list {
            grid-template-columns: 1fr 1fr;
            gap: 0.8rem;
          }

          .filter-btn {
            font-size: 12px;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default JanaDashboard;
