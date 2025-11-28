// Auctions Module

let auctionsListener = null;
let activeTimers = {};

// Initialize auctions
function initAuctions() {
    loadAuctions();
    setupAuctionListeners();
}

// Load all active auctions
function loadAuctions() {
    const auctionsRef = database.ref('auctions');

    // Remove previous listener if exists
    if (auctionsListener) {
        auctionsRef.off('value', auctionsListener);
    }

    // Listen for auctions changes
    auctionsListener = auctionsRef.on('value', (snapshot) => {
        const auctions = snapshot.val();
        displayAuctions(auctions);
    });
}

// Display auctions in grid
function displayAuctions(auctions) {
    const grid = document.getElementById('auctions-grid');
    grid.innerHTML = '';

    if (!auctions) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-secondary);">No hay subastas activas en este momento.</p>';
        return;
    }

    // Convert to array and filter active auctions
    const auctionsArray = Object.entries(auctions)
        .map(([id, data]) => ({ id, ...data }))
        .filter(auction => {
            const timeLeft = auction.endTime - Date.now();
            return timeLeft > 0; // Only show active auctions
        })
        .sort((a, b) => a.endTime - b.endTime); // Sort by ending soonest

    if (auctionsArray.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-secondary);">No hay subastas activas en este momento.</p>';
        return;
    }

    auctionsArray.forEach(auction => {
        const card = createAuctionCard(auction);
        grid.appendChild(card);
    });
}

// Create auction card element
function createAuctionCard(auction) {
    const card = document.createElement('div');
    card.className = 'auction-card';
    card.dataset.auctionId = auction.id;

    const timeInfo = utils.getTimeRemaining(auction.endTime);
    const timerClass = timeInfo.isEndingSoon ? 'auction-timer ending-soon' : 'auction-timer';

    card.innerHTML = `
    <img src="${auction.imageUrl}" alt="${auction.title}" class="auction-image" onerror="this.src='https://via.placeholder.com/400x220?text=Sin+Imagen'">
    <div class="auction-content">
      <h3 class="auction-title">${utils.sanitizeInput(auction.title)}</h3>
      <p class="auction-description">${utils.sanitizeInput(auction.description)}</p>
      <div class="auction-price">${utils.formatCurrency(auction.currentPrice)}</div>
      <div class="${timerClass}" data-end-time="${auction.endTime}">
        ⏱️ ${timeInfo.text}
      </div>
      <div class="auction-actions">
        <button class="btn-bid" onclick="openBidModal('${auction.id}', '${auction.title}', ${auction.currentPrice})">
          💰 Pujar
        </button>
      </div>
    </div>
  `;

    // Start countdown timer
    startCountdown(auction.id, auction.endTime);

    return card;
}

// Start countdown timer for an auction
function startCountdown(auctionId, endTime) {
    // Clear existing timer if any
    if (activeTimers[auctionId]) {
        clearInterval(activeTimers[auctionId]);
    }

    activeTimers[auctionId] = setInterval(() => {
        const card = document.querySelector(`[data-auction-id="${auctionId}"]`);
        if (!card) {
            clearInterval(activeTimers[auctionId]);
            delete activeTimers[auctionId];
            return;
        }

        const timerElement = card.querySelector('.auction-timer');
        if (!timerElement) return;

        const timeInfo = utils.getTimeRemaining(endTime);

        if (timeInfo.expired) {
            timerElement.textContent = '⏱️ Finalizada';
            timerElement.classList.remove('ending-soon');
            clearInterval(activeTimers[auctionId]);
            delete activeTimers[auctionId];

            // Reload auctions to remove expired ones
            setTimeout(() => loadAuctions(), 2000);
        } else {
            timerElement.textContent = `⏱️ ${timeInfo.text}`;
            if (timeInfo.isEndingSoon) {
                timerElement.classList.add('ending-soon');
            }
        }
    }, 1000);
}

// Open bid modal
function openBidModal(auctionId, title, currentPrice) {
    document.getElementById('bid-auction-id').value = auctionId;
    document.getElementById('bid-auction-title').textContent = title;
    document.getElementById('bid-current-price').textContent = Math.round(currentPrice).toLocaleString('es-AR');
    document.getElementById('bid-amount').value = '';
    document.getElementById('bid-amount').min = currentPrice + 1000;
    document.getElementById('bid-amount').step = 1000;
    document.getElementById('bid-amount').placeholder = `Mínimo: $${(currentPrice + 1000).toLocaleString('es-AR')}`;

    const modal = document.getElementById('modal-place-bid');
    modal.classList.add('active');
}

// Close bid modal
function closeBidModal() {
    const modal = document.getElementById('modal-place-bid');
    modal.classList.remove('active');
}

// Place a bid
async function placeBid(auctionId, amount) {
    try {
        const userId = authModule.getCurrentUserId();
        const userData = authModule.getCurrentUserData();

        if (!userId) {
            utils.showToast('Debes iniciar sesión para pujar', 'error');
            return;
        }

        // Get current auction data
        const auctionSnapshot = await database.ref(`auctions/${auctionId}`).once('value');
        const auction = auctionSnapshot.val();

        if (!auction) {
            utils.showToast('Subasta no encontrada', 'error');
            return;
        }

        // Validate bid amount
        if (amount <= auction.currentPrice) {
            utils.showToast('Tu puja debe ser mayor a la actual', 'error');
            return;
        }

        // Validate minimum increment of $1000
        const minIncrement = 1000;
        if (amount < auction.currentPrice + minIncrement) {
            utils.showToast(`La puja debe ser al menos $${minIncrement.toLocaleString('es-AR')} mayor a la actual`, 'error');
            return;
        }

        // Check if auction is still active
        if (auction.endTime <= Date.now()) {
            utils.showToast('Esta subasta ya finalizó', 'error');
            return;
        }

        // Create bid
        const bidData = {
            userId: userId,
            userName: userData.displayName,
            amount: amount,
            timestamp: Date.now()
        };

        // Save bid and update auction price
        await database.ref(`bids/${auctionId}`).push(bidData);
        await database.ref(`auctions/${auctionId}/currentPrice`).set(amount);

        utils.showToast('¡Puja realizada exitosamente!', 'success');
        closeBidModal();
    } catch (error) {
        console.error('Error placing bid:', error);
        utils.showToast('Error al realizar la puja', 'error');
    }
}

// Create new auction
async function createAuction(auctionData) {
    try {
        const userId = authModule.getCurrentUserId();

        if (!authModule.canCreateAuctions()) {
            utils.showToast('No tienes permisos para crear subastas', 'error');
            return;
        }

        const endTime = Date.now() + (auctionData.duration * 60 * 60 * 1000);

        const auction = {
            title: auctionData.title,
            description: auctionData.description,
            imageUrls: auctionData.imageUrls || (auctionData.imageUrl ? [auctionData.imageUrl] : []),
            imageUrl: auctionData.imageUrl || (auctionData.imageUrls ? auctionData.imageUrls[0] : ''), // Primary image
            startingPrice: parseFloat(auctionData.startingPrice),
            currentPrice: parseFloat(auctionData.startingPrice),
            endTime: endTime,
            createdBy: userId,
            status: 'active',
            createdAt: Date.now()
        };

        await database.ref('auctions').push(auction);

        utils.showToast('¡Subasta creada exitosamente!', 'success');
        closeCreateAuctionModal();
    } catch (error) {
        console.error('Error creating auction:', error);
        utils.showToast('Error al crear la subasta', 'error');
    }
}

// Open create auction modal
function openCreateAuctionModal() {
    if (!authModule.canCreateAuctions()) {
        utils.showToast('No tienes permisos para crear subastas', 'error');
        return;
    }

    document.getElementById('form-create-auction').reset();
    document.getElementById('modal-create-auction').classList.add('active');
}

// Close create auction modal
function closeCreateAuctionModal() {
    document.getElementById('modal-create-auction').classList.remove('active');
}

// Setup auction event listeners
function setupAuctionListeners() {
    // Create auction button
    const btnCreateAuction = document.getElementById('btn-create-auction');
    if (btnCreateAuction) {
        btnCreateAuction.addEventListener('click', openCreateAuctionModal);
    }

    // Create auction form
    document.getElementById('form-create-auction').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get image URLs
        let imageUrls = [];
        if (window.imageUploadModule) {
            imageUrls = await window.imageUploadModule.getImageUrls('modal-create-auction');
        } else {
            const url = document.getElementById('auction-image').value;
            if (url) imageUrls = [url];
        }

        if (!imageUrls || imageUrls.length === 0) {
            return;
        }

        const auctionData = {
            title: document.getElementById('auction-title').value,
            description: document.getElementById('auction-description').value,
            imageUrls: imageUrls,
            imageUrl: imageUrls[0], // Primary image
            startingPrice: document.getElementById('auction-starting-price').value,
            duration: document.getElementById('auction-duration').value
        };

        createAuction(auctionData);
    });

    // Place bid form
    document.getElementById('form-place-bid').addEventListener('submit', (e) => {
        e.preventDefault();

        const auctionId = document.getElementById('bid-auction-id').value;
        const amount = parseFloat(document.getElementById('bid-amount').value);

        placeBid(auctionId, amount);
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });

    // Close modal on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Load user's bids
async function loadMyBids() {
    const userId = authModule.getCurrentUserId();
    if (!userId) return;

    const container = document.getElementById('my-bids-list');
    container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">Cargando...</p>';

    try {
        // Get all bids
        const bidsSnapshot = await database.ref('bids').once('value');
        const allBids = bidsSnapshot.val();

        if (!allBids) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No has realizado ninguna puja aún.</p>';
            return;
        }

        // Get all auctions
        const auctionsSnapshot = await database.ref('auctions').once('value');
        const auctions = auctionsSnapshot.val();

        // Find user's bids
        const myBids = [];
        Object.entries(allBids).forEach(([auctionId, bids]) => {
            Object.entries(bids).forEach(([bidId, bid]) => {
                if (bid.userId === userId) {
                    myBids.push({
                        ...bid,
                        auctionId,
                        auction: auctions[auctionId]
                    });
                }
            });
        });

        if (myBids.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No has realizado ninguna puja aún.</p>';
            return;
        }

        // Sort by timestamp (newest first)
        myBids.sort((a, b) => b.timestamp - a.timestamp);

        // Display bids
        container.innerHTML = myBids.map(bid => `
      <div class="auction-card">
        <img src="${bid.auction.imageUrl}" alt="${bid.auction.title}" class="auction-image" onerror="this.src='https://via.placeholder.com/400x220?text=Sin+Imagen'">
        <div class="auction-content">
          <h3 class="auction-title">${utils.sanitizeInput(bid.auction.title)}</h3>
          <p><strong>Tu puja:</strong> ${utils.formatCurrency(bid.amount)}</p>
          <p><strong>Puja actual:</strong> ${utils.formatCurrency(bid.auction.currentPrice)}</p>
          <p><strong>Fecha:</strong> ${utils.formatDate(bid.timestamp)}</p>
          ${bid.amount === bid.auction.currentPrice ?
                '<p style="color: var(--color-success); font-weight: 600;">🏆 ¡Vas ganando!</p>' :
                '<p style="color: var(--color-warning);">⚠️ Te han superado</p>'
            }
        </div>
      </div>
    `).join('');
    } catch (error) {
        console.error('Error loading bids:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--color-danger);">Error al cargar tus pujas.</p>';
    }
}

// Load all auctions for admin panel
async function loadAdminAuctions() {
    if (!authModule.isAdmin()) return;

    const container = document.getElementById('admin-auctions-list');
    if (!container) return;

    try {
        const snapshot = await database.ref('auctions').once('value');
        const auctions = snapshot.val();

        if (!auctions) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No hay subastas.</p>';
            return;
        }

        const auctionsArray = Object.entries(auctions)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.createdAt - a.createdAt);

        container.innerHTML = auctionsArray.map(auction => {
            const timeInfo = utils.getTimeRemaining(auction.endTime);
            const statusBadge = timeInfo.expired ?
                '<span style="color: var(--color-danger);">❌ Finalizada</span>' :
                '<span style="color: var(--color-success);">✅ Activa</span>';

            return `
                <div class="profile-card" style="margin-bottom: 1rem;">
                    <div style="display: flex; gap: 1rem; align-items: start;">
                        <img src="${auction.imageUrl}" alt="${auction.title}" 
                             style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;"
                             onerror="this.src='https://via.placeholder.com/100?text=Sin+Imagen'">
                        <div style="flex: 1;">
                            <h4>${utils.sanitizeInput(auction.title)}</h4>
                            <p><strong>Precio actual:</strong> ${utils.formatCurrency(auction.currentPrice)}</p>
                            <p><strong>Estado:</strong> ${statusBadge}</p>
                            <p><strong>Tiempo restante:</strong> ${timeInfo.text}</p>
                            <p><strong>Creada:</strong> ${utils.formatDate(auction.createdAt)}</p>
                        </div>
                        <button class="btn btn-danger" onclick="deleteAuction('${auction.id}', '${auction.title}')" 
                                style="align-self: flex-start;">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading admin auctions:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--color-danger);">Error al cargar subastas.</p>';
    }
}

// Delete auction (admin only)
async function deleteAuction(auctionId, auctionTitle) {
    if (!authModule.isAdmin()) {
        utils.showToast('No tienes permisos para eliminar subastas', 'error');
        return;
    }

    const confirmed = confirm(`¿Estás seguro de que quieres eliminar la subasta "${auctionTitle}"?\n\nEsta acción no se puede deshacer.`);

    if (!confirmed) return;

    try {
        utils.showLoading();

        // Delete auction
        await database.ref(`auctions/${auctionId}`).remove();

        // Delete associated bids
        await database.ref(`bids/${auctionId}`).remove();

        utils.hideLoading();
        utils.showToast('✅ Subasta eliminada exitosamente', 'success');

        // Reload admin auctions list
        loadAdminAuctions();
    } catch (error) {
        console.error('Error deleting auction:', error);
        utils.hideLoading();
        utils.showToast('Error al eliminar la subasta', 'error');
    }
}

// Make functions globally available
window.openBidModal = openBidModal;
window.closeBidModal = closeBidModal;
window.deleteAuction = deleteAuction;

// Export module
window.auctionsModule = {
    initAuctions,
    loadMyBids,
    loadAdminAuctions
};
