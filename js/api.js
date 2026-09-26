/* ============================================================
   MOCK API — Reads from data/*.json
   ============================================================ */

const API = (() => {
    const cache = {};

    async function loadJSON(path) {
        if (cache[path]) return cache[path];

        if (location.protocol === 'file:') {
            console.error(
                `[API] ❌ You are opening this page directly from disk (file://).\n` +
                `       Use a local server (Live Server, python -m http.server, etc.)`
            );
            return [];
        }

        try {
            const res = await fetch(path);
            if (!res.ok) {
                console.error(`[API] ❌ Failed to fetch ${path} — HTTP ${res.status}`);
                return [];
            }
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                cache[path] = data;
                console.log(`[API] ✅ Loaded ${path} (${data.length} items)`);
                return data;
            } catch (parseErr) {
                console.error(`[API] ❌ JSON PARSE ERROR in ${path}:`, parseErr.message);
                return [];
            }
        } catch (err) {
            console.error(`[API] ❌ Fetch error for ${path}:`, err.message);
            return [];
        }
    }

    return {
        async getDestinations() { return loadJSON('data/destinations.json'); },
        async getDestination(id) {
            const list = await this.getDestinations();
            return list.find(d => d.id === id) || null;
        },
        async getTours(filter = {}) {
            let tours = await loadJSON('data/tours.json');
            if (filter.featured) tours = tours.filter(t => t.featured);
            if (filter.type) tours = tours.filter(t => t.type === filter.type);
            if (filter.region) tours = tours.filter(t => t.region === filter.region);
            if (filter.destinationId) tours = tours.filter(t => t.destinationId === filter.destinationId);
            if (filter.maxPrice) tours = tours.filter(t => t.price <= filter.maxPrice);
            if (filter.search) {
                const q = filter.search.toLowerCase();
                tours = tours.filter(t =>
                    t.title.toLowerCase().includes(q) ||
                    t.summary.toLowerCase().includes(q) ||
                    t.region.toLowerCase().includes(q)
                );
            }
            if (filter.sort === 'price-asc') tours.sort((a, b) => a.price - b.price);
            if (filter.sort === 'price-desc') tours.sort((a, b) => b.price - a.price);
            if (filter.sort === 'rating') tours.sort((a, b) => b.rating - a.rating);
            if (filter.sort === 'duration') tours.sort((a, b) => a.durationDays - b.durationDays);
            return tours;
        },
        async getTour(id) {
            const tours = await this.getTours();
            return tours.find(t => t.id === id) || null;
        },
        formatPrice(n) {
            return new Intl.NumberFormat('en-PK', {
                style: 'currency',
                currency: 'PKR',
                maximumFractionDigits: 0
            }).format(n);
        }
    };
})();
