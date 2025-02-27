import { generateStarRating } from "../stars/stars.js";
export default async function decorate(block) {
    const createStoreCards = stores => {
        console.log(stores)
        const container = document.createElement("div");
        container.className = "store-cards-container";

        stores.forEach((storeData, i) => {
            const card = document.createElement("div");
            card.className = "store-card";

            // Card Header - Name & Rating
            const header = document.createElement("div");
            header.className = "store-card__header";

            const title = document.createElement("h4");
            title.className = "store-card__title";
            title.textContent = `${i+1}. ${storeData.name}`;

            const rating = document.createElement("div");
            rating.className = "store-card__rating";
            rating.innerHTML = `${generateStarRating({rating: Number(storeData.rating.slice(0,3)), max: 5, color: '#e79f5c', spacing: 2})}<p class="store-card__rating-text">${storeData.rating}</p>`;

            header.appendChild(title);
            header.appendChild(rating);

            // Card Body - Type, Address, Description
            const body = document.createElement("div");
            body.className = "store-card__body";

            const type = document.createElement("p");
            type.className = "store-card__type";
            type.textContent = storeData.type;

            const address = document.createElement("p");
            address.className = "store-card__address";
            address.textContent = storeData.address;

            const description = document.createElement("p");
            description.className = "store-card__description";
            description.textContent = storeData.description;

            body.appendChild(type);
            body.appendChild(address);
            body.appendChild(description);

            // Card Footer - Phone & Map Link
            const footer = document.createElement("div");
            footer.className = "store-card__footer";

            const phone = document.createElement("a");
            phone.className = "store-card__phone";
            phone.href = `tel:${storeData.phone}`;
            phone.textContent = `${storeData.phone}`;

            footer.appendChild(phone);

            card.appendChild(header);
            card.appendChild(body);
            card.appendChild(footer);

            container.appendChild(card);
        });

        return container;
    }

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
        if (!document.querySelector(`link[href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css']`)) {
            await loadStylesheet('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        }
        if (!document.querySelector(`script[src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js']`)) {
            await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
        }

        const response = await fetch('/store-locator/stores.json');
        const stores = await response.json();
        console.log('Stores:', stores);
        const parentBlock = document.querySelector('.store-locator-container');
        const showStoreDataConfig = !!parentBlock ? parentBlock?.getAttribute('data-columns') : 'all';
        console.log(showStoreDataConfig)
        const block = document.querySelector('div.store-locator.block');

        // Create and append the map container
        const mapContainer = document.createElement('div');
        mapContainer.id = 'map';
        mapContainer.style.width = '100%';
        mapContainer.style.height = '400px';
        block.insertBefore(mapContainer, block.firstChild);
        setTimeout(() => {
            // block.insertBefore(table, block.lastChild);
            const map = L.map('map').setView([stores.data[0].lat, stores.data[0].lng], 10);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // Add a marker
            // const marker = L.marker([51.505, -0.09]).addTo(map);

            // Bind a popup
            // marker.bindPopup("Hello! I am a Leaflet marker.").openPopup();

            // Invalidate the map size to ensure it renders correctly
            // map.invalidateSize();

            // Append all store cards to the document body (or any container)
            block.appendChild(createStoreCards(stores.data));

            stores.data.forEach((store, i) => {


                // Add marker to the map if store has lat and lng
                if (store.lat && store.lng) {
                    const marker = L.marker([store.lat, store.lng]).addTo(map);
                    marker.bindPopup(`<p>${i+1}. ${store.name}</p>`);
                }


                // // Add click event to the row to show the callout
                // row.addEventListener('click', () => {
                //     // marker.openPopup();
                //     // map.setView([store.YCOORD, store.XCOORD], 13);
                // });
            });


        }, 0);



    } catch (error) {
        console.error('Error fetching store data:', error);
    }
}