export default async function decorate(block) {
    try {
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

                // L.marker([store.X, store.Y]).addTo(map)
                
                // // Add click event to the row to show the callout
                // row.addEventListener('click', () => {
                //     marker.openPopup();
                //     map.setView([store.Y, store.X], 13);
                // });
            });

            block.insertBefore(table, block.lastChild);
        }, 0); // Delay to ensure the map container is fully visible
    } catch (error) {
        console.error('Error fetching store data:', error);
    }
}

// Include the Leaflet CSS and JS in your HTML
// <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
// <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>