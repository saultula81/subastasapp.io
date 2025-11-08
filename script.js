// ====================================================================
// Archivo: script.js (FRONT-END) - VERSIÓN FINAL CORREGIDA CORS
// ====================================================================

// ¡IMPORTANTE! REEMPLAZAR con su URL confirmada.
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzARTUvZwGtQIhr48uQPs_iZalsYkwYbZGkneRPRFSZkvP5PL4mlZ1s92sY2Cxjn8Oh/exec'; 

// --------------------------------------------------------------------
// 1. MANEJADOR DE ENVÍO DE PUJA (POST)
// --------------------------------------------------------------------
async function handleBidSubmission(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const data = { action: 'place_bid' };
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
        // SOLUCIÓN CORS: Fetch en dos pasos para POST
        const firstResponse = await fetch(APPSCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data), 
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const resultText = await firstResponse.text();
        const result = JSON.parse(resultText); 
        
        const messageContainer = form.parentElement.querySelector('.bid-message');
        
        if (result.status === 'Success') {
            messageContainer.style.color = 'green';
            messageContainer.textContent = result.message;
            form.reset(); 
            
            const ID_Lote = form.querySelector('input[name="ID_Lote"]').value;
            fetchCurrentBid(ID_Lote); 

        } else {
            messageContainer.style.color = 'red';
            messageContainer.textContent = result.message;
        }

    } catch (error) {
        console.error("Error al enviar la puja:", error);
        form.parentElement.querySelector('.bid-message').textContent = 'Error de conexión. Intente de nuevo.';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'PUJAR';
    }
}

// --------------------------------------------------------------------
// 2. OBTENER Y MOSTRAR PUJA ACTUAL (GET)
// --------------------------------------------------------------------
async function fetchCurrentBid(ID_Lote) {
    const bidDisplay = document.getElementById(`bid-display-${ID_Lote}`);
    if (!bidDisplay) return;

    try {
        // SOLUCIÓN CORS: Fetch en dos pasos para GET
        const firstResponse = await fetch(`${APPSCRIPT_URL}?action=get_current_bid&ID_Lote=${ID_Lote}`);
        const jsonText = await firstResponse.text();
        const bidData = JSON.parse(jsonText); 
        
        // El precio inicial se usa si la puja máxima es 0
        const initialPriceElement = document.getElementById(`initial-price-${ID_Lote}`);
        const minimumBid = bidData.maxBid > 0 ? bidData.maxBid : (initialPriceElement ? parseFloat(initialPriceElement.textContent) : 0);

        bidDisplay.innerHTML = `
            Puja actual: <strong>$${minimumBid.toFixed(2)}</strong> <br>
            Postor líder: ${bidData.bidder}
        `;
        
        // Actualizar el valor mínimo en el campo de puja
        const bidInput = document.querySelector(`#bid-form-${ID_Lote} input[name="Amount"]`);
        if (bidInput) {
            bidInput.min = (minimumBid + 0.01).toFixed(2);
            bidInput.placeholder = `Mínimo: $${(minimumBid + 0.01).toFixed(2)}`;
        }

    } catch (error) {
        console.error(`Error al obtener puja para ${ID_Lote}:`, error);
        bidDisplay.textContent = 'Error al cargar puja.';
    }
}

// --------------------------------------------------------------------
// 3. CARGAR Y MOSTRAR LOTES CON FORMULARIOS
// --------------------------------------------------------------------
async function displayLots() {
    const container = document.getElementById('lots-container');
    container.innerHTML = '<p>Cargando lotes...</p>'; 

    try {
        // SOLUCIÓN CORS: Fetch en dos pasos para GET
        const firstResponse = await fetch(`${APPSCRIPT_URL}?action=get_lots`);
        const jsonText = await firstResponse.text();
        const lotsData = JSON.parse(jsonText); 

        container.innerHTML = '';
        
        if (lotsData.length === 0) {
            container.innerHTML = '<p>No hay lotes activos actualmente.</p>';
            return;
        }

        lotsData.forEach(lot => {
            const lotElement = document.createElement('div');
            lotElement.className = 'auction-item';
            
            // Aseguramos que el Precio_Inicial sea un número para toFixed
            const initialPrice = parseFloat(lot.Precio_Inicial);

            lotElement.innerHTML = `
                <div class="card">
                    <img src="${lot.URL_Imagen}" alt="${lot.Nombre}" class="lot-image">
                    <h3>${lot.Nombre}</h3>
                    <p>${lot.Descripción}</p>
                    <p>Precio Inicial: <strong id="initial-price-${lot.ID_Lote}">${initialPrice.toFixed(2)}</strong></p>
                    
                    <div id="bid-display-${lot.ID_Lote}" style="margin-bottom: 10px;">
                        Cargando puja actual...
                    </div>

                    <form id="bid-form-${lot.ID_Lote}" class="bid-form">
                        <input type="hidden" name="ID_Lote" value="${lot.ID_Lote}">
                        <input type="number" name="Amount" placeholder="Monto de tu puja" required step="0.01">
                        <input type="text" name="Bidder" placeholder="Tu nombre o alias" required>
                        <button type="submit">PUJAR</button>
                        <p class="bid-message" style="margin-top: 10px;"></p>
                    </form>
                </div>
            `;
            container.appendChild(lotElement);
            
            // Adjuntar el manejador de envío y actualizar puja
            document.getElementById(`bid-form-${lot.ID_Lote}`).addEventListener('submit', handleBidSubmission);
            fetchCurrentBid(lot.ID_Lote);
        });

    } catch (error) {
        console.error("Error al cargar los lotes:", error);
        container.innerHTML = '<p style="color: red;">Error al conectar con la base de datos. (Verifique el error CORS y la URL de Apps Script)</p>';
    }
}


// Iniciar la carga al cargar la página y actualizar pujas cada 10 segundos
displayLots();
setInterval(() => {
    // Si hay lotes mostrados, actualiza sus pujas individualmente
    const lots = document.querySelectorAll('.auction-item');
    lots.forEach(lotElement => {
        const ID_Lote = lotElement.querySelector('input[name="ID_Lote"]').value;
        fetchCurrentBid(ID_Lote);
    });
}, 10000);
