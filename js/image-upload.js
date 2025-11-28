// Image Upload Module with ImgBB API - Multiple Images Support
// ImgBB: Free, no complex registration, unlimited storage

const imageUploadModule = {
    currentFiles: [],
    uploadedImageUrls: [],
    minImages: 3,
    maxImages: 3,
    // ImgBB API Key
    IMGBB_API_KEY: '2f094209f45de396a38bcc6407cb4d54',

    init() {
        this.setupTabSwitching();
        this.setupFileInput();
    },

    setupTabSwitching() {
        document.querySelectorAll('.upload-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.target.dataset.tab;
                this.switchTab(tabType);
            });
        });
    },

    switchTab(tabType) {
        document.querySelectorAll('.upload-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabType);
        });

        document.querySelectorAll('.upload-tab-content').forEach(content => {
            const contentId = content.id.replace('upload-', '').replace('-tab', '');
            content.classList.toggle('active', contentId === tabType);
        });
    },

    setupFileInput() {
        const fileInputs = document.querySelectorAll('[id$="-image-file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files);
            });
        });
    },

    handleFileSelect(files) {
        if (!files || files.length === 0) return;

        // Convert FileList to Array
        const filesArray = Array.from(files);

        // Check if adding these files would exceed the limit
        if (this.currentFiles.length + filesArray.length > this.maxImages) {
            utils.showToast(`Debes seleccionar exactamente ${this.maxImages} imágenes`, 'error');
            return;
        }

        // Validate each file
        for (const file of filesArray) {
            if (!file.type.startsWith('image/')) {
                utils.showToast('Solo se permiten archivos de imagen (JPG, PNG, GIF)', 'error');
                return;
            }

            if (file.size > 32 * 1024 * 1024) {
                utils.showToast('Cada imagen no debe superar 32MB', 'error');
                return;
            }
        }

        // Add files to current files
        this.currentFiles.push(...filesArray);
        this.showPreviews();
        this.updateCounter();
    },

    showPreviews() {
        const previewContainers = document.querySelectorAll('.upload-preview-grid');

        previewContainers.forEach(container => {
            container.innerHTML = '';

            this.currentFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview ${index + 1}">
                        <button type="button" class="btn-remove-preview" data-index="${index}">✕</button>
                    `;

                    // Add remove listener
                    previewItem.querySelector('.btn-remove-preview').addEventListener('click', () => {
                        this.removeImage(index);
                    });

                    container.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            });

            // Show container if there are files
            if (this.currentFiles.length > 0) {
                container.classList.remove('hidden');
            }
        });
    },

    updateCounter() {
        const counters = document.querySelectorAll('.image-counter');
        counters.forEach(counter => {
            const hasCorrectAmount = this.currentFiles.length === this.minImages;
            counter.textContent = `${this.currentFiles.length}/${this.maxImages} imágenes ${hasCorrectAmount ? '✓' : ''}`;
            counter.style.color = hasCorrectAmount ? 'var(--color-success)' : 'var(--color-warning)';
            counter.classList.toggle('hidden', this.currentFiles.length === 0);
        });
    },

    removeImage(index) {
        this.currentFiles.splice(index, 1);
        this.uploadedImageUrls.splice(index, 1);
        this.showPreviews();
        this.updateCounter();

        // Clear file input if no files left
        if (this.currentFiles.length === 0) {
            document.querySelectorAll('[id$="-image-file"]').forEach(input => {
                input.value = '';
            });
        }
    },

    // Upload multiple files to ImgBB
    async uploadAllToImgBB() {
        if (this.currentFiles.length === 0) return [];

        const urls = [];
        const totalFiles = this.currentFiles.length;

        try {
            this.showProgress();

            for (let i = 0; i < this.currentFiles.length; i++) {
                const file = this.currentFiles[i];
                const progress = ((i + 1) / totalFiles) * 100;

                this.updateProgress(progress, `Subiendo imagen ${i + 1} de ${totalFiles}...`);

                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`https://api.imgbb.com/1/upload?key=${this.IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('❌ ImgBB API Error:', errorData);
                    throw new Error(errorData.error?.message || 'Error al subir imagen');
                }

                const data = await response.json();

                if (data.success) {
                    urls.push(data.data.url);
                    console.log(`✅ Image ${i + 1} uploaded:`, data.data.url);
                } else {
                    throw new Error('ImgBB API error');
                }
            }

            this.uploadedImageUrls = urls;
            this.hideProgress();
            utils.showToast(`✅ ${urls.length} imagen(es) subida(s) exitosamente`, 'success');
            return urls;

        } catch (error) {
            console.error('Error uploading images:', error);
            this.hideProgress();
            utils.showToast('Error al subir las imágenes. Intenta de nuevo.', 'error');
            return null;
        }
    },

    showProgress() {
        const progressElements = document.querySelectorAll('.upload-progress');
        progressElements.forEach(el => el.classList.remove('hidden'));
    },

    updateProgress(percent, text = '') {
        const fills = document.querySelectorAll('.progress-fill');
        const texts = document.querySelectorAll('.progress-text');

        fills.forEach(fill => fill.style.width = `${percent}%`);
        texts.forEach(textEl => {
            textEl.textContent = text || `${Math.round(percent)}%`;
        });
    },

    hideProgress() {
        const progressElements = document.querySelectorAll('.upload-progress');
        progressElements.forEach(el => el.classList.add('hidden'));
        this.updateProgress(0);
    },

    // Get final image URLs
    async getImageUrls(modalId = 'modal-create-auction') {
        const modal = document.getElementById(modalId);
        const activeTab = modal.querySelector('.upload-tab.active');

        if (!activeTab) {
            utils.showToast('Por favor selecciona una opción de imagen', 'error');
            return null;
        }

        const tabType = activeTab.dataset.tab;

        if (tabType === 'file') {
            // Check exact requirement
            if (this.currentFiles.length !== this.minImages) {
                utils.showToast(`Debes seleccionar exactamente ${this.minImages} imágenes`, 'error');
                return null;
            }

            // Upload if not already uploaded
            if (this.uploadedImageUrls.length === 0) {
                utils.showLoading();
                const urls = await this.uploadAllToImgBB();
                utils.hideLoading();
                return urls;
            }

            return this.uploadedImageUrls;

        } else if (tabType === 'url') {
            const urlInput = modal.querySelector('[id$="-image-url"]');
            const url = urlInput.value.trim();

            if (!url) {
                utils.showToast('Por favor ingresa una URL de imagen', 'error');
                return null;
            }

            try {
                new URL(url);
                return [url]; // Return as array for consistency
            } catch (e) {
                utils.showToast('URL de imagen inválida', 'error');
                return null;
            }
        }

        return null;
    },

    reset() {
        this.currentFiles = [];
        this.uploadedImageUrls = [];

        document.querySelectorAll('[id$="-image-file"]').forEach(input => {
            input.value = '';
        });

        document.querySelectorAll('[id$="-image-url"]').forEach(input => {
            input.value = '';
        });

        document.querySelectorAll('.upload-preview-grid').forEach(grid => {
            grid.innerHTML = '';
            grid.classList.add('hidden');
        });

        this.updateCounter();
        this.hideProgress();

        const firstTab = document.querySelector('.upload-tab[data-tab="file"]');
        if (firstTab) {
            firstTab.click();
        }
    }
};

window.imageUploadModule = imageUploadModule;
