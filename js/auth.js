// Authentication Module

let currentUser = null;
let currentUserData = null;

// Initialize auth state listener
function initAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData(user.uid);
            showAppView();
        } else {
            currentUser = null;
            currentUserData = null;
            showAuthView();
        }
        utils.hideLoading();
    });
}

// Load user data from database
async function loadUserData(userId) {
    try {
        console.log('📥 Loading user data for:', userId);
        const snapshot = await database.ref(`users/${userId}`).once('value');
        currentUserData = snapshot.val();

        if (!currentUserData) {
            // Create user data if it doesn't exist
            currentUserData = {
                email: currentUser.email,
                displayName: currentUser.displayName || 'Usuario',
                role: 'user',
                createdAt: Date.now()
            };
            await database.ref(`users/${userId}`).set(currentUserData);
            console.log('✨ Created new user data:', currentUserData);
        } else {
            console.log('✅ User data loaded:', currentUserData);
        }

        updateUIForRole(currentUserData.role);

        // Load admin data if applicable
        if (currentUserData.role === 'admin') {
            try {
                if (window.collaborationModule) {
                    console.log('👑 Admin detected, loading collaboration data...');
                    collaborationModule.loadNotifications();
                    collaborationModule.loadAuctionRequests();
                }
                if (window.auctionsModule) {
                    auctionsModule.loadAdminAuctions();
                }
            } catch (adminLoadError) {
                console.error('⚠️ Error loading admin data:', adminLoadError);
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        utils.showToast('Error al cargar datos: ' + error.message, 'error');
    }
}

// Register new user
async function register(email, password, displayName) {
    try {
        utils.showLoading();

        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update profile
        await user.updateProfile({ displayName });

        // Create user data in database
        await database.ref(`users/${user.uid}`).set({
            email: email,
            displayName: displayName,
            role: 'user',
            createdAt: Date.now()
        });

        utils.showToast('¡Cuenta creada exitosamente!', 'success');
    } catch (error) {
        console.error('Registration error:', error);
        let message = 'Error al crear la cuenta';

        if (error.code === 'auth/email-already-in-use') {
            message = 'Este email ya está registrado';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Email inválido';
        } else if (error.code === 'auth/weak-password') {
            message = 'La contraseña debe tener al menos 6 caracteres';
        }

        utils.showToast(message, 'error');
        utils.hideLoading();
    }
}

// Login user
async function login(email, password) {
    try {
        utils.showLoading();
        await auth.signInWithEmailAndPassword(email, password);
        utils.showToast('¡Bienvenido!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        let message = 'Error al iniciar sesión';

        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            message = 'Email o contraseña incorrectos';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Email inválido';
        }

        utils.showToast(message, 'error');
        utils.hideLoading();
    }
}

// Logout user
async function logout() {
    try {
        await auth.signOut();
        utils.showToast('Sesión cerrada', 'info');
    } catch (error) {
        console.error('Logout error:', error);
        utils.showToast('Error al cerrar sesión', 'error');
    }
}

// Show auth view
function showAuthView() {
    document.getElementById('auth-view').classList.add('active');
    document.getElementById('app-view').classList.remove('active');
}

// Show app view
function showAppView() {
    document.getElementById('auth-view').classList.remove('active');
    document.getElementById('app-view').classList.add('active');

    // Update profile info
    if (currentUserData) {
        document.getElementById('profile-name').textContent = currentUserData.displayName;
        document.getElementById('profile-email').textContent = currentUserData.email;
        document.getElementById('user-name-nav').textContent = currentUserData.displayName;

        const roleBadge = document.getElementById('profile-role');
        roleBadge.textContent = getRoleText(currentUserData.role);
        roleBadge.className = `role-badge ${currentUserData.role}`;
    }
}

// Update UI based on user role
function updateUIForRole(role) {
    console.log('🔧 Updating UI for role:', role);

    const adminElements = document.querySelectorAll('.admin-only');
    const userElements = document.querySelectorAll('.user-only');
    const adminCollabElements = document.querySelectorAll('.admin-collaborator-only');

    console.log('Found elements:', {
        admin: adminElements.length,
        user: userElements.length,
        adminCollab: adminCollabElements.length
    });

    // Hide all role-specific elements first
    adminElements.forEach(el => el.classList.add('hidden'));
    userElements.forEach(el => el.classList.add('hidden'));
    adminCollabElements.forEach(el => el.classList.add('hidden'));

    // Show elements based on role
    if (role === 'admin') {
        console.log('✅ Showing admin and admin-collaborator elements');
        adminElements.forEach(el => el.classList.remove('hidden'));
        adminCollabElements.forEach(el => el.classList.remove('hidden'));
    } else if (role === 'collaborator') {
        console.log('✅ Showing admin-collaborator elements');
        adminCollabElements.forEach(el => el.classList.remove('hidden'));
    } else {
        console.log('✅ Showing user elements');
        userElements.forEach(el => el.classList.remove('hidden'));
    }

    console.log('✅ UI update complete for role:', role);
}

// Get role text in Spanish
function getRoleText(role) {
    const roleTexts = {
        'admin': 'Administrador',
        'collaborator': 'Colaborador',
        'user': 'Usuario'
    };
    return roleTexts[role] || 'Usuario';
}

// Check if user is admin
function isAdmin() {
    return currentUserData && currentUserData.role === 'admin';
}

// Check if user can create auctions
function canCreateAuctions() {
    return currentUserData && (currentUserData.role === 'admin' || currentUserData.role === 'collaborator');
}

// Get current user ID
function getCurrentUserId() {
    return currentUser ? currentUser.uid : null;
}

// Get current user data
function getCurrentUserData() {
    return currentUserData;
}

// Setup auth event listeners
function setupAuthListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        login(email, password);
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!utils.isValidEmail(email)) {
            utils.showToast('Email inválido', 'error');
            return;
        }

        if (!utils.isValidPassword(password)) {
            utils.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        register(email, password, name);
    });

    // Toggle between login and register
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    });

    // Logout button
    document.getElementById('btn-logout').addEventListener('click', logout);
}

// Export functions
window.authModule = {
    initAuth,
    setupAuthListeners,
    isAdmin,
    canCreateAuctions,
    getCurrentUserId,
    getCurrentUserData,
    logout
};
