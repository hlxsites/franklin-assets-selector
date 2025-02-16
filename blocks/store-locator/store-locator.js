export default async function decorate(block) {
    
    try {
        const response = await fetch('/store-locator/stores.json');
        const stores = await response.json();
        console.log('Stores:', stores);

        const block = document.querySelector('div.store-locator.block');
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
        });

        block.insertBefore(table, block.firstChild);
    } catch (error) {
        console.error('Error fetching store data:', error);
    }
}