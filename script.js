const API_BASE = 'https://openapi.programming-hero.com/api/phones';
let currentPage = 1;
let currentSearch = '';
let currentFilter = 'all';
const itemsPerPage = 12;
let allDevices = [];

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    deviceFilter: document.getElementById('deviceFilter'),
    phoneContainer: document.getElementById('phoneContainer'),
    loadMoreContainer: document.getElementById('loadMoreContainer'),
    phoneModal: document.getElementById('phoneModal'),
    modalContent: document.getElementById('modalContent'),
};

// Debounce function
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), timeout);
    };
}

// Fetch devices from API
const fetchDevices = async (search = '') => {
    try {
        const response = await fetch(`${API_BASE}?search=${search}`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
};

// Filter devices by type
function filterDevicesByType(devices, type) {
    if (type === 'all') return devices;
    return devices.filter(device => {
        const slug = device.slug.toLowerCase();
        if (type === 'phone') return !slug.includes('tablet') && !slug.includes('watch');
        return slug.includes(type);
    });
}

// Render devices
const renderDevices = (devices, initialLoad = true) => {
    if (initialLoad) {
        elements.phoneContainer.innerHTML = '';
        currentPage = 1;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedDevices = devices.slice(0, end);

    paginatedDevices.forEach(device => {
        const card = document.createElement('div');
        card.className = 'phone-card';
        card.innerHTML = `
            <img src="${device.image}" alt="${device.phone_name}">
            <h3>${device.phone_name}</h3>
            <p>${device.brand}</p>
            <button class="view-detail" data-id="${device.slug}">View Details</button>
        `;
        elements.phoneContainer.appendChild(card);
    });

    elements.loadMoreContainer.classList.toggle('hidden', end >= devices.length);
};

// Show device details in modal
const showDeviceDetails = async (deviceId) => {
    try {
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        const response = await fetch(`${API_BASE}/${deviceId}`);
        const data = await response.json();
        const device = data.data;

        // Extract specifications
        const { brand, name, image, releaseDate, mainFeatures } = device;
        const { storage, displaySize, chipSet, memory, sensors } = mainFeatures || {};

        // Format specifications
        const specs = `
            <p><strong>Brand:</strong> ${brand}</p>
            <p><strong>Storage:</strong> ${storage || 'N/A'}</p>
            <p><strong>Display Size:</strong> ${displaySize || 'N/A'}</p>
            <p><strong>Chipset:</strong> ${chipSet || 'N/A'}</p>
            <p><strong>Memory:</strong> ${memory || 'N/A'}</p>
            <p><strong>Sensors:</strong> ${sensors ? sensors.join(', ') : 'N/A'}</p>
            <p><strong>Release Date:</strong> ${releaseDate || 'N/A'}</p>
        `;

        // Update modal content
        elements.modalContent.innerHTML = `
            <h3>${name}</h3>
            <img src="${image}" alt="${name}" class="modal-image">
            ${specs}
        `;

        // Show modal
        elements.phoneModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching device details:', error);
    }
};

// Close modal function
const closeModal = () => {
    elements.phoneModal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore scrolling
};

// Event Listeners
elements.searchInput.addEventListener('input', debounce(async () => {
    currentSearch = elements.searchInput.value.trim();
    const devices = await fetchDevices(currentSearch);
    allDevices = filterDevicesByType(devices, currentFilter);
    renderDevices(allDevices);
}, 300));

elements.deviceFilter.addEventListener('change', async () => {
    currentFilter = elements.deviceFilter.value;
    const devices = await fetchDevices(currentSearch);
    allDevices = filterDevicesByType(devices, currentFilter);
    renderDevices(allDevices);
});

document.getElementById('showMore').addEventListener('click', () => {
    currentPage++;
    renderDevices(allDevices, false);
});

// Modal handling
document.addEventListener('click', e => {
    // Open modal
    if (e.target.closest('.view-detail')) {
        const deviceId = e.target.dataset.id;
        showDeviceDetails(deviceId);
    }

    // Close modal
    if (e.target.classList.contains('closeModal') || 
        e.target.closest('.closeModal') || 
        e.target === elements.phoneModal) {
        closeModal();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.phoneModal.classList.contains('hidden')) {
        closeModal();
    }
});

// Initial load
fetchDevices().then(devices => {
    allDevices = filterDevicesByType(devices, currentFilter);
    renderDevices(allDevices);
});