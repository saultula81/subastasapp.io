// Collaboration Module (Now handles Auction Requests)

let notificationsListener = null;

// Initialize collaboration system
function initCollaboration() {
    setupCollaborationListeners();

    // Load notifications if admin
    if (authModule.isAdmin()) {
        loadNotifications();
        loadAuctionRequests();
    }
}

// Request auction publication
async function requestAuctionPublication(title, description, imageUrl, price, duration, phone) {
    try {
        const userId = authModule.getCurrentUserId();
        const userData = authModule.getCurrentUserData();

        if (!userId || !userData) {
            utils.showToast('Debes iniciar sesión', 'error');
            return;
        }

        // Check if already has a pending request
        const existingRequestsSnapshot = await database.ref('auctionRequests')
            .orderByChild('userId')
            .equalTo(userId)
            .once('value');

        const existingRequests = existingRequestsSnapshot.val();
        if (existingRequests) {
            const hasPending = Object.values(existingRequests).some(req => req.status === 'pending');
            if (hasPending) {
                utils.showToast('Ya tienes una solicitud pendiente', 'warning');
                return;
            }
        }

        // Create auction request
        const requestData = {
            userId: userId,
            userName: userData.displayName,
            userEmail: userData.email,
            userPhone: phone,
            title: title,
            description: description,
            imageUrl: imageUrl,
            startingPrice: parseFloat(price),
            duration: parseInt(duration),
            status: 'pending',
            requestedAt: Date.now()
        };

        console.log('📝 Creating auction request...');
        const requestRef = await database.ref('auctionRequests').push(requestData);
        console.log('✅ Request created with ID:', requestRef.key);

        // Create notification for all admins (Best effort)
        try {
            console.log('👥 Fetching admins for notification...');
            const usersSnapshot = await database.ref('users').once('value');
            const users = usersSnapshot.val();

            if (users) {
                const adminIds = Object.entries(users)
                    .filter(([id, user]) => user.role === 'admin')
                    .map(([id]) => id);

                console.log('📢 Sending notifications to admins:', adminIds);

                // Send notification to each admin
                for (const adminId of adminIds) {
                    try {
                        await database.ref(`notifications/${adminId}`).push({
                            type: 'auction_request',
                            requestId: requestRef.key,
                            message: `${userData.displayName} solicita publicar: ${title}`,
                            read: false,
                            createdAt: Date.now()
                        });
                    } catch (notifError) {
                        console.error(`⚠️ Failed to send notification to admin ${adminId}:`, notifError);
                    }
                }
            }
        } catch (adminFetchError) {
            console.warn('⚠️ Could not fetch admins for notifications (likely permission issue). Request still created.', adminFetchError);
        }

        utils.showToast('✅ Solicitud enviada. El admin la revisará pronto.', 'success');
        closeCollaborationModal();
    } catch (error) {
        console.error('❌ Error requesting auction:', error);
        if (error.code === 'PERMISSION_DENIED') {
            utils.showToast('Error de permisos: No puedes realizar esta acción', 'error');
        } else {
            utils.showToast('Error al enviar la solicitud: ' + error.message, 'error');
        }
    }
}

// Load auction requests (admin only)
async function loadAuctionRequests() {
    console.log('📥 Loading auction requests...');
    console.log('🔍 isAdmin check:', authModule.isAdmin());

    if (!authModule.isAdmin()) {
        console.log('⛔ User is not admin, aborting loadAuctionRequests');
        return;
    }

    const container = document.getElementById('auction-requests-list');
    console.log('📦 Container found:', container ? 'YES' : 'NO');

    if (!container) {
        console.error('❌ Container "auction-requests-list" not found in DOM');
        return;
    }

    try {
        console.log('🔄 Fetching auction requests from database...');
        const snapshot = await database.ref('auctionRequests')
            .orderByChild('status')
            .equalTo('pending')
            .once('value');

        const requests = snapshot.val();
        console.log('📊 Raw requests data:', requests);
        console.log('📈 Number of requests:', requests ? Object.keys(requests).length : 0);

        if (!requests) {
            console.log('ℹ️ No pending requests found');
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No hay solicitudes pendientes.</p>';
            return;
        }

        const requestsArray = Object.entries(requests)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.requestedAt - a.requestedAt);

        console.log('✅ Rendering', requestsArray.length, 'requests');

        container.innerHTML = requestsArray.map(request => `
      <div class="profile-card" style="margin-bottom: 1rem;">
        <h4>${utils.sanitizeInput(request.title)}</h4>
        <p><strong>Usuario:</strong> ${utils.sanitizeInput(request.userName)}</p>
        <p><strong>Teléfono:</strong> ${utils.sanitizeInput(request.userPhone)}</p>
        <p><strong>Precio:</strong> $${request.startingPrice}</p>
        <p><strong>Descripción:</strong> ${utils.sanitizeInput(request.description)}</p>
        <div style="margin: 10px 0;">
            <img src="${request.imageUrl}" alt="Preview" style="max-width: 100px; border-radius: 5px;">
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button class="btn btn-primary" onclick="approveAuctionRequest('${request.id}')">
            ✅ Crear Subasta
          </button>
          <button class="btn btn-danger" onclick="rejectAuctionRequest('${request.id}')">
            ❌ Rechazar
          </button>
        </div>
      </div>
    `).join('');

        console.log('✅ Requests rendered successfully');
    } catch (error) {
        console.error('❌ Error loading requests:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--color-danger);">Error al cargar solicitudes.</p>';
    }
}

// Approve auction request (Creates the auction)
async function approveAuctionRequest(requestId) {
    try {
        // Get request data
        const snapshot = await database.ref(`auctionRequests/${requestId}`).once('value');
        const request = snapshot.val();

        if (!request) {
            utils.showToast('Solicitud no encontrada', 'error');
            return;
        }

        // Create the auction
        const auctionData = {
            title: request.title,
            description: request.description,
            imageUrl: request.imageUrl,
            startingPrice: request.startingPrice,
            currentPrice: request.startingPrice,
            duration: request.duration,
            endTime: Date.now() + (request.duration * 60 * 60 * 1000),
            createdBy: request.userId,
            status: 'active',
            createdAt: Date.now(),
            bids: {}
        };

        await database.ref('auctions').push(auctionData);

        // Update request status
        await database.ref(`auctionRequests/${requestId}`).update({
            status: 'approved',
            reviewedAt: Date.now()
        });

        utils.showToast('✅ Subasta creada y solicitud aprobada', 'success');
        loadAuctionRequests();
    } catch (error) {
        console.error('Error approving request:', error);
        utils.showToast('Error al aprobar la solicitud', 'error');
    }
}

// Reject auction request
async function rejectAuctionRequest(requestId) {
    try {
        await database.ref(`auctionRequests/${requestId}`).update({
            status: 'rejected',
            reviewedAt: Date.now()
        });

        utils.showToast('Solicitud rechazada', 'info');
        loadAuctionRequests();
    } catch (error) {
        console.error('Error rejecting request:', error);
        utils.showToast('Error al rechazar la solicitud', 'error');
    }
}

// Load notifications (admin only)
function loadNotifications() {
    if (!authModule.isAdmin()) return;

    const userId = authModule.getCurrentUserId();
    const notificationsRef = database.ref(`notifications/${userId}`);

    // Remove previous listener
    if (notificationsListener) {
        notificationsRef.off('value', notificationsListener);
    }

    // Listen for notifications
    notificationsListener = notificationsRef.on('value', (snapshot) => {
        const notifications = snapshot.val();
        updateNotificationBadge(notifications);
    });
}

// Update notification badge
function updateNotificationBadge(notifications) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    if (!notifications) {
        badge.classList.add('hidden');
        return;
    }

    const unreadCount = Object.values(notifications)
        .filter(notif => !notif.read)
        .length;

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// Mark notifications as read
async function markNotificationsAsRead() {
    if (!authModule.isAdmin()) return;

    const userId = authModule.getCurrentUserId();
    const snapshot = await database.ref(`notifications/${userId}`).once('value');
    const notifications = snapshot.val();

    if (!notifications) return;

    const updates = {};
    Object.keys(notifications).forEach(notifId => {
        updates[`${notifId}/read`] = true;
    });

    await database.ref(`notifications/${userId}`).update(updates);
}

// Open collaboration/auction request modal
function openCollaborationModal() {
    const form = document.getElementById('form-request-auction');
    if (form) {
        form.reset();
        // Reset image upload module if available
        if (window.imageUploadModule) {
            window.imageUploadModule.reset();
        }
    }
    document.getElementById('modal-request-auction').classList.add('active');
}

// Close collaboration/auction request modal
function closeCollaborationModal() {
    document.getElementById('modal-request-auction').classList.remove('active');
}

// Setup collaboration event listeners
function setupCollaborationListeners() {
    // Request auction button
    const btnRequestAuction = document.getElementById('btn-request-auction');
    if (btnRequestAuction) {
        btnRequestAuction.addEventListener('click', openCollaborationModal);
    }

    // Request auction form
    const formRequestAuction = document.getElementById('form-request-auction');
    if (formRequestAuction) {
        formRequestAuction.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form values
            const title = document.getElementById('request-title').value;
            const description = document.getElementById('request-description').value;
            const price = document.getElementById('request-price').value;
            const duration = document.getElementById('request-duration').value;
            const phone = document.getElementById('request-phone').value;

            // Get image URL from upload module or input
            let imageUrl = '';
            if (window.imageUploadModule) {
                imageUrl = await window.imageUploadModule.getImageUrl('modal-request-auction');
            } else {
                imageUrl = document.getElementById('request-image').value;
            }

            if (!imageUrl) {
                utils.showToast('Por favor agrega una imagen', 'error');
                return;
            }

            // Create auction request
            requestAuctionPublication(title, description, imageUrl, price, duration, phone);
        });
    }
}

// Make functions globally available
window.approveAuctionRequest = approveAuctionRequest;
window.rejectAuctionRequest = rejectAuctionRequest;

// Export module
window.collaborationModule = {
    initCollaboration,
    loadAuctionRequests,
    markNotificationsAsRead
};
