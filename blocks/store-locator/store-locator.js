export default async function decorate(block) {
    try {
        // Function to load external scripts
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        // Function to load external stylesheets
        const loadStylesheet = (href) => {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = resolve;
                link.onerror = reject;
                document.head.appendChild(link);
            });
        };

        // Load Leaflet CSS and JS if not already loaded
        if (!document.querySelector('link[href="https://unpkg.com/leaflet/dist/leaflet.css"]')) {
            await loadStylesheet('https://unpkg.com/leaflet/dist/leaflet.css');
        }
        if (!document.querySelector('script[src="https://unpkg.com/leaflet/dist/leaflet.js"]')) {
            await loadScript('https://unpkg.com/leaflet/dist/leaflet.js');
        }

        const response = await fetch('/store-locator/stores.json');
        const stores = await response.json();
        console.log('Stores:', stores);

        const block = document.querySelector('div.store-locator.block');

        // Create and append the map container
        const mapContainer = document.createElement('div');
        mapContainer.id = 'map';
        mapContainer.style.width = '100%';
        mapContainer.style.height = '400px';
        block.insertBefore(mapContainer, block.firstChild);

        // Ensure the map container is fully visible before initializing the map
        setTimeout(() => {
            // Initialize the map using Leaflet
            const map = L.map('map').setView([32.7765, -79.9311], 13); // Default center (Charleston, SC)

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Invalidate the map size to ensure it renders correctly
            map.invalidateSize();

            // Create the table
            const table = document.createElement('table');
            const headerRow = document.createElement('tr');

            // Assuming the JSON data has keys like 'name', 'address', 'city', 'state', 'zip'
            const headers = ['Name', 'Address', 'Zip', 'Phone', 'X', 'Y'];
            headers.forEach(headerText => {
                const header = document.createElement('th');
                header.textContent = headerText;
                headerRow.appendChild(header);
            });
            table.appendChild(headerRow);

            stores.data.forEach(store => {
                const row = document.createElement('tr');
                const columnsToShow = 6; // You can configure the number of columns to show here
                Object.values(store).slice(0, columnsToShow).forEach(text => {
                    const cell = document.createElement('td');
                    cell.textContent = text;
                    row.appendChild(cell);
                });
                table.appendChild(row);

                // Add marker to the map
                const marker = L.marker([store.YCOORD, store.XCOORD]).addTo(map)
                    .bindPopup(`<b>${store.STORENAME}</b><br>${store.ADDRESS}`);

                // Add click event to the row to show the callout
                row.addEventListener('click', () => {
                    marker.openPopup();
                    map.setView([store.YCOORD, store.XCOORD], 13);
                });
            });

            block.insertBefore(table, block.lastChild);
        }, 0); // Delay to ensure the map container is fully visible
    } catch (error) {
        console.error('Error fetching store data:', error);
    }
}