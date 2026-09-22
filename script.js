"use strict";

/* =========================
     STORAGE
     ========================= */
const STORAGE = {
    USER: "serviceHubUser",
    SESSION: "serviceHubSession",
    BOOKINGS: "serviceHubBookings",
};

/* =========================
     SERVICE DATA
     ========================= */
const SERVICES = [
    {
        id: "ac",
        title: "AC Repair",
        description: "Professional AC inspection, maintenance and repair.",
        price: 499,
        icon: "ac",
    },
    {
        id: "fridge",
        title: "Fridge Repair",
        description: "Reliable refrigerator repair and maintenance.",
        price: 399,
        icon: "fridge",
    },
    {
        id: "washing",
        title: "Washing Machine Repair",
        description: "Expert washing machine repair and servicing.",
        price: 449,
        icon: "washing",
    },
    {
        id: "cleaning",
        title: "House Cleaning",
        description: "Convenient home and bathroom cleaning services.",
        price: 699,
        icon: "cleaning",
        variants: {
            "1 BHK": 699,
            "2 BHK": 899,
            "3 BHK": 1099,
            "Bathroom Cleaning": 499,
        },
    },
    {
        id: "vehicle",
        title: "Vehicle Repair Service",
        description: "Repair services for two-wheelers and three-wheelers.",
        price: 299,
        icon: "vehicle",
        variants: {
            "2-Wheeler Repair": 299,
            "3-Wheeler Repair": 399,
        },
    },
    {
        id: "pickup",
        title: "Product Pickup & Drop Service",
        description: "Convenient product pickup and delivery service.",
        price: 249,
        icon: "pickup",
    },
];

const DEFAULT_BOOKINGS = [
    {
        userId: "SM100001",
        userName: "John Doe",
        serviceId: "SV100001",
        date: "2026-09-20",
        slot: "10:00 AM - 12:00 PM",
        type: "AC Repair",
        vendor: "QuickFix Solutions",
        status: "Confirmed",
    },
    {
        userId: "SM100002",
        userName: "Priya Sharma",
        serviceId: "SV100002",
        date: "2026-09-21",
        slot: "09:00 AM - 11:00 AM",
        type: "Fridge Repair",
        vendor: "HomeCare Experts",
        status: "Confirmed",
    },
    {
        userId: "SM100003",
        userName: "Rahul Das",
        serviceId: "SV100003",
        date: "2026-09-22",
        slot: "02:00 PM - 04:00 PM",
        type: "Washing Machine Repair",
        vendor: "Urban Services",
        status: "Confirmed",
    },
    {
        userId: "SM100004",
        userName: "Ananya Roy",
        serviceId: "SV100004",
        date: "2026-09-23",
        slot: "04:00 PM - 06:00 PM",
        type: "House Cleaning - 2 BHK",
        vendor: "HomeCare Experts",
        status: "Confirmed",
    },
    {
        userId: "SM100005",
        userName: "Arjun Sen",
        serviceId: "SV100005",
        date: "2026-09-24",
        slot: "11:00 AM - 01:00 PM",
        type: "Vehicle Repair - 2-Wheeler",
        vendor: "QuickFix Solutions",
        status: "Confirmed",
    },
    {
        userId: "SM100006",
        userName: "Neha Gupta",
        serviceId: "SV100006",
        date: "2026-09-25",
        slot: "09:00 AM - 11:00 AM",
        type: "Product Pickup & Drop Service",
        vendor: "Urban Services",
        status: "Confirmed",
    },
    {
        userId: "SM100007",
        userName: "Vikram Roy",
        serviceId: "SV100007",
        date: "2026-09-26",
        slot: "02:00 PM - 04:00 PM",
        type: "House Cleaning - Bathroom Cleaning",
        vendor: "HomeCare Experts",
        status: "Confirmed",
    },
    {
        userId: "SM100008",
        userName: "Sneha Paul",
        serviceId: "SV100008",
        date: "2026-09-27",
        slot: "04:00 PM - 06:00 PM",
        type: "Vehicle Repair - 3-Wheeler",
        vendor: "QuickFix Solutions",
        status: "Confirmed",
    },
];

let currentPage = 1;
const PAGE_SIZE = 5;
let activeService = null;
let latestBooking = null;

/* =========================
     SAFE STORAGE HELPERS
     ========================= */
function safeGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function safeSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        showToast(
            "Browser storage is unavailable. Data may not persist.",
            "error",
        );
        return false;
    }
}

function readJSON(key, fallback) {
    const raw = safeGet(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (error) {
        return fallback;
    }
}

function writeJSON(key, value) {
    return safeSet(key, JSON.stringify(value));
}

/* =========================
     AUTH HELPERS
     ========================= */
function getCurrentUser() {
    return readJSON(STORAGE.USER, null);
}

function isLoggedIn() {
    return Boolean(safeGet(STORAGE.SESSION)) && Boolean(getCurrentUser());
}

function generateUserId() {
    let id;
    do {
        id = "SM" + String(Math.floor(100000 + Math.random() * 900000));
    } while (getCurrentUser()?.userId === id);
    return id;
}

function loginUser(userId) {
    return safeSet(
        STORAGE.SESSION,
        JSON.stringify({
            userId,
            loggedInAt: new Date().toISOString(),
        }),
    );
}

function logoutUser() {
    try {
        localStorage.removeItem(STORAGE.SESSION);
    } catch (error) {
        // Storage can be unavailable in some browser modes.
    }
    latestBooking = null;
    updateNavbar();
    navigate("landing");
    showToast("You have been logged out.", "info");
}

function requireLogin(targetView) {
    if (!isLoggedIn()) {
        navigate("login");
        showToast("Please log in to continue.", "info");
        return false;
    }
    return true;
}

/* =========================
     NAVIGATION
     ========================= */
const VIEW_IDS = {
    landing: "landingView",
    register: "registerView",
    login: "loginView",
    services: "servicesView",
    bookings: "bookingsView",
    registerSuccess: "registerSuccessView",
    bookingSuccess: "bookingSuccessView",
};

function navigate(view, scrollTarget = null) {
    closeMobileMenu();
    console.log(view);
    if (
        (view === "services" ||
            view === "bookings" ||
            view === "bookingSuccess") &&
        !requireLogin(view)
    ) {
        return;
    }

    Object.values(VIEW_IDS).forEach((id) => {
        document.getElementById(id).classList.remove("active");
        const nav = document.getElementById("nav-"+id)
        if(nav) nav.classList.add("active");
    });

    const viewId = VIEW_IDS[view] || VIEW_IDS.landing;
    document.getElementById(viewId).classList.add("active");
    const nav = document.getElementById("nav-"+viewId)
    if (nav) nav.classList.remove("active");

    if (view === "services") {
        renderServices();
        updateDashboardStats();
    }

    if (view === "bookings") {
        currentPage = 1;
        renderBookings();
    }

    updateNavbar();

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (scrollTarget) {
        setTimeout(() => {
            const target = document.getElementById(scrollTarget);
            if (target) target.scrollIntoView({ behavior: "smooth" });
        }, 40);
    }
}

function navigateFromNav(view) {
    if (view === "landing") {
        navigate("landing");
    } else if (view === "about") {
        if (
            document.getElementById("landingView").classList.contains("active")
        ) {
            document
                .getElementById("aboutSection")
                .scrollIntoView({ behavior: "smooth" });
        } else {
            navigate("landing", "aboutSection");
        }
    } else {
        navigate(view);
    }
}

/* =========================
     NAVBAR / MOBILE
     ========================= */
function updateNavbar() {
    const loggedIn = isLoggedIn();
    document
        .querySelectorAll(".guest-link")
        .forEach((el) => el.classList.toggle("hidden", loggedIn));
    document
        .querySelectorAll(".user-link")
        .forEach((el) => el.classList.toggle("hidden", !loggedIn));
    document.getElementById("navUser").style.display = loggedIn
        ? "flex"
        : "none";
    const heroActions = document.getElementById("landingHeroActions");
    if (heroActions) {
        const buttons = heroActions.querySelectorAll("button");
        buttons[0].hidden = loggedIn;
        buttons[1].hidden = loggedIn;
        buttons[2].hidden = !loggedIn;
    }

    if (loggedIn) {
        const user = getCurrentUser();
        const name = user?.username || "User";
        document.getElementById("navUserName").textContent = name;
        document.getElementById("navAvatar").textContent = name
            .charAt(0)
            .toUpperCase();
        document.getElementById("welcomeName").textContent = name;
    }
}

function closeMobileMenu() {
    document.getElementById("navLinks").classList.remove("open");
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
}

/* =========================
     TOASTS
     ========================= */
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(15px)";
        setTimeout(() => toast.remove(), 220);
    }, 3300);
}

/* =========================
     ICONS
     ========================= */
function serviceIcon(type) {
    const icons = {
        ac: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="8" rx="2"/><path d="M7 9h10M8 17c0-1.5 1-2 1-3M12 19c0-1.5 1-2 1-3M16 17c0-1.5 1-2 1-3"/></svg>',
        fridge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 11h12M9 7v2M9 14v3"/></svg>',
        washing:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7h1M11 7h5"/></svg>',
        cleaning:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 20h10M10 16l2-10h3l1 10M8 20l2-4M13 6l-1-3h4l-1 3"/></svg>',
        vehicle:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 15l1.8-6h10.4L19 15v4H5z"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/><path d="M7.5 12h9"/></svg>',
        pickup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="6" width="10" height="11" rx="1.5"/><path d="M14 10h3l3 3v4h-6z"/><circle cx="8" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/><path d="M7 10h4"/></svg>',
    };
    return icons[type] || icons.ac;
}

/* =========================
     SERVICES
     ========================= */
function renderServices() {
    const grid = document.getElementById("servicesGrid");
    grid.innerHTML = "";

    SERVICES.forEach((service) => {
        const card = document.createElement("article");
        card.className = "service-card";
        card.innerHTML = `
        <div class="service-icon">${serviceIcon(service.icon)}</div>
        <h3>${service.title}</h3>
        <p>${service.description}</p>
        <div class="service-footer">
          <div>
            <span class="starting">Starting from</span>
            <span class="price">â‚¹${service.price}</span>
          </div>
          <button class="btn btn-primary" type="button" data-book-service="${service.id}">Book Now</button>
        </div>
      `;
        grid.appendChild(card);
    });
}

function getServiceById(id) {
    return SERVICES.find((service) => service.id === id) || null;
}

function openBookingModal(serviceId) {
    if (!requireLogin("services")) return;

    const service = getServiceById(serviceId);
    if (!service) {
        showToast("The selected service could not be found.", "error");
        return;
    }

    activeService = service;
    document.getElementById("selectedService").value = service.id;
    document.getElementById("bookingModalTitle").textContent =
        "Book " + service.title;
    document.getElementById("bookingModalSubtitle").textContent =
        "Choose your preferred date, vendor and service details.";

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("bookingDate").min = today;
    document.getElementById("bookingDate").value = "";
    document.getElementById("bookingSlot").value = "";
    document.getElementById("bookingVendor").value = "";
    document.getElementById("bookingAddress").value =
        getCurrentUser()?.address || "";
    document.getElementById("bookingAddressCount").textContent =
        document.getElementById("bookingAddress").value.length;
    document.getElementById("bookingAmount").value = "â‚¹" + service.price;

    clearBookingErrors();
    renderServiceSpecificFields(service);

    const modal = document.getElementById("bookingModal");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.getElementById("bookingDate").focus();
}

function closeBookingModal() {
    const modal = document.getElementById("bookingModal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    activeService = null;
}

function renderServiceSpecificFields(service) {
    const wrapper = document.getElementById("serviceSpecificFields");
    const addressGroup = document.getElementById("addressFieldGroup");
    const pickupDrop = document.getElementById("pickupDropFields");

    wrapper.innerHTML = "";
    pickupDrop.classList.add("hidden");
    addressGroup.classList.remove("hidden");

    if (service.id === "cleaning") {
        wrapper.innerHTML = `
        <div class="field" style="margin-bottom:15px;">
          <label for="serviceVariant">Cleaning Type *</label>
          <select id="serviceVariant" required>
            <option value="">Select cleaning type</option>
            <option value="1 BHK">1 BHK â€” â‚¹699</option>
            <option value="2 BHK">2 BHK â€” â‚¹899</option>
            <option value="3 BHK">3 BHK â€” â‚¹1099</option>
            <option value="Bathroom Cleaning">Bathroom Cleaning â€” â‚¹499</option>
          </select>
          <div class="field-error" id="serviceVariantError"></div>
        </div>
      `;
        document
            .getElementById("serviceVariant")
            .addEventListener("change", () => {
                updateAmount();
            });
    }

    if (service.id === "vehicle") {
        wrapper.innerHTML = `
        <div class="field" style="margin-bottom:15px;">
          <label for="serviceVariant">Vehicle Type *</label>
          <select id="serviceVariant" required>
            <option value="">Select vehicle type</option>
            <option value="2-Wheeler Repair">2-Wheeler Repair â€” â‚¹299</option>
            <option value="3-Wheeler Repair">3-Wheeler Repair â€” â‚¹399</option>
          </select>
          <div class="field-error" id="serviceVariantError"></div>
        </div>
      `;
        document
            .getElementById("serviceVariant")
            .addEventListener("change", () => {
                updateAmount();
            });
    }

    if (service.id === "pickup") {
        addressGroup.classList.add("hidden");
        pickupDrop.classList.remove("hidden");
        document.getElementById("pickupAddress").value = "";
        document.getElementById("dropAddress").value = "";
    }
}

function calculateAmount() {
    if (!activeService) return 0;

    const variant = document.getElementById("serviceVariant");
    if (variant && activeService.variants) {
        return activeService.variants[variant.value] || activeService.price;
    }

    return activeService.price;
}

function updateAmount() {
    document.getElementById("bookingAmount").value = "â‚¹" + calculateAmount();
}

function clearBookingErrors() {
    [
        "bookingDateError",
        "bookingSlotError",
        "bookingAddressError",
        "bookingVendorError",
        "serviceVariantError",
        "pickupAddressError",
        "dropAddressError",
    ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
    });
}

function setError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
}

function validateBooking() {
    clearBookingErrors();

    if (!activeService) {
        showToast("Please select a service.", "error");
        return false;
    }

    const date = document.getElementById("bookingDate").value;
    const slot = document.getElementById("bookingSlot").value;
    const vendor = document.getElementById("bookingVendor").value;

    let valid = true;
    const today = new Date().toISOString().split("T")[0];

    if (!date) {
        setError("bookingDateError", "Please select a date.");
        valid = false;
    } else if (date < today) {
        setError("bookingDateError", "Past dates are not allowed.");
        valid = false;
    }

    if (!slot) {
        setError("bookingSlotError", "Please select a time slot.");
        valid = false;
    }

    if (!vendor) {
        setError("bookingVendorError", "Please select a vendor.");
        valid = false;
    }

    if (activeService.id === "pickup") {
        const pickup = document.getElementById("pickupAddress").value.trim();
        const drop = document.getElementById("dropAddress").value.trim();

        if (!pickup) {
            setError("pickupAddressError", "Pickup address is required.");
            valid = false;
        } else if (pickup.length > 100) {
            setError("pickupAddressError", "Maximum 100 characters.");
            valid = false;
        }

        if (!drop) {
            setError("dropAddressError", "Drop address is required.");
            valid = false;
        } else if (drop.length > 100) {
            setError("dropAddressError", "Maximum 100 characters.");
            valid = false;
        }
    } else {
        const address = document.getElementById("bookingAddress").value.trim();

        if (!address) {
            setError("bookingAddressError", "Address is required.");
            valid = false;
        } else if (address.length > 100) {
            setError("bookingAddressError", "Maximum 100 characters.");
            valid = false;
        }
    }

    const variant = document.getElementById("serviceVariant");
    if (variant && !variant.value) {
        setError("serviceVariantError", "Please select an option.");
        valid = false;
    }

    return valid;
}

function generateServiceId() {
    const bookings = loadBookings();
    let id;
    do {
        id = "SV" + String(Math.floor(100000 + Math.random() * 900000));
    } while (bookings.some((booking) => booking.serviceId === id));
    return id;
}

function confirmBooking() {
    if (!validateBooking()) {
        showToast("Please correct the highlighted fields.", "error");
        return;
    }

    const user = getCurrentUser();
    if (!user) {
        showToast("Please log in to continue.", "info");
        closeBookingModal();
        navigate("login");
        return;
    }

    const variant = document.getElementById("serviceVariant")?.value || "";
    const type = variant
        ? activeService.title + " - " + variant
        : activeService.title;
    const date = document.getElementById("bookingDate").value;
    const slot = document.getElementById("bookingSlot").value;
    const vendor = document.getElementById("bookingVendor").value;

    const booking = {
        userId: user.userId,
        userName: user.username,
        serviceId: generateServiceId(),
        date,
        slot,
        type,
        vendor,
        status: "Confirmed",
        amount: calculateAmount(),
    };

    if (activeService.id === "pickup") {
        booking.pickupAddress = document
            .getElementById("pickupAddress")
            .value.trim();
        booking.dropAddress = document
            .getElementById("dropAddress")
            .value.trim();
    } else {
        booking.address = document
            .getElementById("bookingAddress")
            .value.trim();
    }

    const bookings = loadBookings();
    bookings.push(booking);

    if (!writeJSON(STORAGE.BOOKINGS, bookings)) return;

    latestBooking = booking;
    closeBookingModal();

    document.getElementById("bookingSuccessId").textContent = booking.serviceId;
    document.getElementById("bookingSuccessService").textContent = booking.type;
    document.getElementById("bookingSuccessVendor").textContent =
        booking.vendor;
    document.getElementById("bookingSuccessDate").textContent = formatDate(
        booking.date,
    );
    document.getElementById("bookingSuccessSlot").textContent = booking.slot;

    navigate("bookingSuccess");
    showToast("Service booked successfully.", "success");
}

/* =========================
     REGISTRATION
     ========================= */
function validateRegistration() {
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const address = document.getElementById("regAddress").value.trim();
    const contact = document.getElementById("regContact").value.trim();

    const errors = {
        username: "",
        email: "",
        password: "",
        address: "",
        contact: "",
    };

    if (!username) errors.username = "User Name is required.";
    else if (username.length > 50) errors.username = "Maximum 50 characters.";

    if (!email) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.email = "Enter a valid email address.";

    if (!password) errors.password = "Password is required.";
    else if (password.length > 30) errors.password = "Maximum 30 characters.";

    if (!address) errors.address = "Address is required.";
    else if (address.length > 100) errors.address = "Maximum 100 characters.";

    if (!contact) errors.contact = "Contact Number is required.";
    else if (!/^\d{10}$/.test(contact))
        errors.contact = "Enter exactly 10 digits.";

    document.getElementById("regUsernameError").textContent = errors.username;
    document.getElementById("regEmailError").textContent = errors.email;
    document.getElementById("regPasswordError").textContent = errors.password;
    document.getElementById("regAddressError").textContent = errors.address;
    document.getElementById("regContactError").textContent = errors.contact;

    return !Object.values(errors).some(Boolean);
}

function registerUser() {
    if (!validateRegistration()) {
        showToast(
            "Please correct the highlighted registration fields.",
            "error",
        );
        return;
    }

    const user = {
        userId: generateUserId(),
        username: document.getElementById("regUsername").value.trim(),
        email: document.getElementById("regEmail").value.trim(),
        password: document.getElementById("regPassword").value,
        address: document.getElementById("regAddress").value.trim(),
        contact: document.getElementById("regContact").value.trim(),
    };

    if (!writeJSON(STORAGE.USER, user)) return;

    document.getElementById("successUserId").textContent = user.userId;
    document.getElementById("successUserName").textContent = user.username;
    document.getElementById("successUserEmail").textContent = user.email;

    document.getElementById("registerForm").reset();
    document.getElementById("regAddressCount").textContent = "0";

    navigate("registerSuccess");
    showToast("Registration completed successfully.", "success");
}

/* =========================
     LOGIN
     ========================= */
function loginUserFromForm() {
    const userId = document.getElementById("loginUserId").value.trim();
    const password = document.getElementById("loginPassword").value;

    document.getElementById("loginUserIdError").textContent = "";
    document.getElementById("loginPasswordError").textContent = "";

    let valid = true;

    if (!userId) {
        document.getElementById("loginUserIdError").textContent =
            "User ID is required.";
        valid = false;
    }

    if (!password) {
        document.getElementById("loginPasswordError").textContent =
            "Password is required.";
        valid = false;
    }

    if (!valid) {
        showToast("Please enter your User ID and password.", "error");
        return;
    }

    const user = getCurrentUser();

    if (!user) {
        showToast("No registered user found. Please register first.", "info");
        return;
    }

    if (user.userId !== userId || user.password !== password) {
        document.getElementById("loginPasswordError").textContent =
            "Invalid User ID or Password.";
        showToast("Invalid User ID or Password.", "error");
        return;
    }

    loginUser(user.userId);
    document.getElementById("loginForm").reset();
    // let heroBtns = document.getElementsByClassName("hero-actions")[0];
    // let buttons = heroBtns.getElementsByTagName("button");
    // buttons[0].hidden = true;
    // buttons[1].hidden = true;

    // buttons[2].hidden = false;
    navigate("services");
    showToast("Login successful.", "success");
}

/* =========================
     BOOKING DATA / PAGINATION
     ========================= */
function generateDefaultBookings() {
    const existing = safeGet(STORAGE.BOOKINGS);
    if (existing !== null) {
        const parsed = readJSON(STORAGE.BOOKINGS, null);
        if (Array.isArray(parsed)) return parsed;
        // Corrupt/malformed data: recover gracefully with the required demo data.
    }

    writeJSON(STORAGE.BOOKINGS, DEFAULT_BOOKINGS);
    return DEFAULT_BOOKINGS.slice();
}

function loadBookings() {
    const bookings = readJSON(STORAGE.BOOKINGS, null);
    if (Array.isArray(bookings)) return bookings;

    return generateDefaultBookings();
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function renderBookings() {
    const bookings = loadBookings();
    const tbody = document.getElementById("bookingTableBody");
    const empty = document.getElementById("emptyBookings");

    if (!bookings.length) {
        tbody.innerHTML = "";
        empty.classList.remove("hidden");
        document.getElementById("pagination").classList.add("hidden");
        return;
    }

    empty.classList.add("hidden");
    document.getElementById("pagination").classList.remove("hidden");

    const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageBookings = bookings.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = pageBookings
        .map(
            (booking) => `
      <tr>
        <td>${escapeHTML(booking.userId)}</td>
        <td>${escapeHTML(booking.userName)}</td>
        <td><strong>${escapeHTML(booking.serviceId)}</strong></td>
        <td>${escapeHTML(formatDate(booking.date))}</td>
        <td>${escapeHTML(booking.slot)}</td>
        <td>${escapeHTML(booking.type)}</td>
        <td><span class="status-badge">${escapeHTML(booking.status)}</span></td>
      </tr>
    `,
        )
        .join("");

    const from = start + 1;
    const to = Math.min(start + PAGE_SIZE, bookings.length);
    document.getElementById("pageInfo").textContent =
        `Showing ${from}â€“${to} of ${bookings.length}`;

    document.getElementById("prevBtn").disabled = currentPage === 1;
    document.getElementById("nextBtn").disabled = currentPage === totalPages;

    const numbers = document.getElementById("pageNumbers");
    numbers.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "page-btn" + (i === currentPage ? " active" : "");
        btn.textContent = String(i);
        btn.setAttribute("aria-label", "Page " + i);
        btn.setAttribute("aria-current", i === currentPage ? "page" : "false");
        btn.addEventListener("click", () => {
            currentPage = i;
            renderBookings();
        });
        numbers.appendChild(btn);
    }
}

function nextPage() {
    const totalPages = Math.ceil(loadBookings().length / PAGE_SIZE);
    if (currentPage < totalPages) {
        currentPage += 1;
        renderBookings();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage -= 1;
        renderBookings();
    }
}

/* =========================
     UI HELPERS
     ========================= */
function updateDashboardStats() {
    document.getElementById("serviceCountStat").textContent = SERVICES.length;
    document.getElementById("bookingCountStat").textContent =
        loadBookings().length;
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function togglePassword(button) {
    const inputId = button.getAttribute("data-toggle-password");
    const input = document.getElementById(inputId);
    if (!input) return;

    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    button.textContent = hidden ? "Hide" : "Show";
    button.setAttribute(
        "aria-label",
        hidden ? "Hide password" : "Show password",
    );
}

/* =========================
     EVENT LISTENERS
     ========================= */
document.addEventListener("DOMContentLoaded", () => {
    generateDefaultBookings();
    renderServices();
    updateNavbar();
    updateDashboardStats();

    document.querySelectorAll("[data-nav]").forEach((button) => {
        button.addEventListener("click", () =>
            navigateFromNav(button.dataset.nav),
        );
    });

    document.getElementById("logoutBtn").addEventListener("click", logoutUser);

    document.getElementById("menuBtn").addEventListener("click", () => {
        const menu = document.getElementById("navLinks");
        const open = menu.classList.toggle("open");
        document
            .getElementById("menuBtn")
            .setAttribute("aria-expanded", String(open));
    });

    document
        .getElementById("registerForm")
        .addEventListener("submit", (event) => {
            event.preventDefault();
            registerUser();
        });

    document.getElementById("loginForm").addEventListener("submit", (event) => {
        event.preventDefault();
        loginUserFromForm();
    });

    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
        button.addEventListener("click", () => togglePassword(button));
    });

    document.getElementById("regContact").addEventListener("input", (event) => {
        event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10);
    });

    document.getElementById("regAddress").addEventListener("input", (event) => {
        document.getElementById("regAddressCount").textContent = String(
            event.target.value.length,
        );
    });

    document
        .getElementById("bookingAddress")
        .addEventListener("input", (event) => {
            document.getElementById("bookingAddressCount").textContent = String(
                event.target.value.length,
            );
        });

    document
        .getElementById("servicesGrid")
        .addEventListener("click", (event) => {
            const button = event.target.closest("[data-book-service]");
            if (button) openBookingModal(button.dataset.bookService);
        });

    document
        .getElementById("closeModalBtn")
        .addEventListener("click", closeBookingModal);
    document
        .getElementById("cancelBookingBtn")
        .addEventListener("click", closeBookingModal);
    document.getElementById("nextBtn").addEventListener("click", nextPage);
    document.getElementById("prevBtn").addEventListener("click", previousPage);

    document
        .getElementById("bookingForm")
        .addEventListener("submit", (event) => {
            event.preventDefault();
            confirmBooking();
        });

    document
        .getElementById("bookingModal")
        .addEventListener("click", (event) => {
            if (event.target.id === "bookingModal") closeBookingModal();
        });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeBookingModal();
            closeMobileMenu();
        }
    });
});
