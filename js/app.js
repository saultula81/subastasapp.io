// Main Application Module

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('SubastasApp initializing...');

    // Show loading screen
    utils.showLoading();

    // Setup all event listeners
    setupEventListeners();

    // Initialize authentication
    authModule.initAuth();
    authModule.setupAuthListeners();

    // Initialize auctions
    auctionsModule.initAuctions();

    // Initialize collaboration
    collaborationModule.initCollaboration();

    // Initialize image upload
    if (window.imageUploadModule) {
        window.imageUploadModule.init();
    }

    // Register service worker for PWA
    registerServiceWorker();
});

// Setup main event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('nav-auctions').addEventListener('click', () => {
        showSection('auctions-section');
        setActiveNav('nav-auctions');
    });

    document.getElementById('nav-my-bids').addEventListener('click', () => {
        showSection('my-bids-section');
        setActiveNav('nav-my-bids');
        auctionsModule.loadMyBids();
    });

    const navAdmin = document.getElementById('nav-admin');
    if (navAdmin) {
        navAdmin.addEventListener('click', () => {
            showSection('admin-section');
            setActiveNav('nav-admin');
            collaborationModule.markNotificationsAsRead();
            collaborationModule.loadAuctionRequests();
            auctionsModule.loadAdminAuctions();
        });
    }

    document.getElementById('nav-profile').addEventListener('click', () => {
        showSection('profile-section');
        setActiveNav('nav-profile');
    });
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
}

// Set active navigation item
function setActiveNav(navId) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to selected nav item
    const navItem = document.getElementById(navId);
    if (navItem) {
        navItem.classList.add('active');
    }
}

// Register service worker for PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Handle install prompt for PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Show install button (you can add this to UI later)
    console.log('PWA install prompt available');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    utils.showToast('¡App instalada exitosamente!', 'success');
});

// Export app module
window.app = {
    showSection,
    setActiveNav
};

console.log('SubastasApp loaded successfully');
