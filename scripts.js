import { dbData } from './db.js';

let currentPage = 1;
let totalPages = 1;

function filterData(startDate, endDate, caFilter = '', page = 1) {
    if (!dbData) {
        console.error("dbData is undefined - ensure db.js is correctly loaded and exported");
        return { data: [], total_pages: 1, current_page: 1, total_entries: 0 };
    }
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000;
    const filtered = dbData
        .map(row => ({
            date: row[1],
            ca: row[2],
            first_profit: row[3],
            time_of_increase_first: row[4],
            final_profit: row[5],
            time_of_increase_final: row[6]
        }))
        .filter(item => {
            const itemDate = new Date(item.date).getTime();
            const matchesDate = itemDate >= start && itemDate < end;
            const matchesCA = caFilter && item.ca ? item.ca.toLowerCase().includes(caFilter.toLowerCase()) : true;
            return matchesDate && matchesCA;
        });

    const pageSize = 25; // Reduced from 100
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedData = filtered.slice(startIdx, endIdx);

    return {
        data: paginatedData,
        total_pages: Math.ceil(filtered.length / pageSize),
        current_page: page,
        total_entries: filtered.length
    };
}

function updateTable(data) {
    const tbody = document.querySelector("#data-table tbody");
    tbody.innerHTML = "";
    data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.ca}</td>
            <td>${item.first_profit ? item.first_profit + ' ↑' : "N/A"}</td>
            <td>${item.time_of_increase_first || "N/A"}</td>
            <td>${item.final_profit ? item.final_profit + ' ↑' : "N/A"}</td>
            <td>${item.time_of_increase_final || "N/A"}</td>
        `;
        tbody.appendChild(row);
    });
}

function updatePagination(current, total) {
    totalPages = total;
    currentPage = current;
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = `
        <button id="prev-page" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button id="next-page" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
    `;

    document.getElementById("prev-page").addEventListener("click", () => changePage(currentPage - 1));
    document.getElementById("next-page").addEventListener("click", () => changePage(currentPage + 1));
}

function updateEntryCount(totalEntries) {
    const entryCountTop = document.getElementById("entry-count-top");
    const entryCountBottom = document.getElementById("entry-count-bottom");
    const text = `Showing ${totalEntries} entries`;
    entryCountTop.textContent = text;
    entryCountBottom.textContent = text;
}

async function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    await refreshData(newPage);
}

async function refreshData(page = 1) {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const caFilter = document.getElementById("ca-filter").value || '';
    const loading = document.getElementById("loading");
    const bullSvg = document.getElementById("bull-svg");

    loading.style.display = "block";
    bullSvg.style.display = "none";

    const result = filterData(startDate, endDate, caFilter, page);
    if (result) {
        updateTable(result.data);
        updatePagination(result.current_page, result.total_pages);
        updateEntryCount(result.total_entries);
        bullSvg.style.display = "none";
    }

    loading.style.display = "none";
}

window.onload = () => {
    document.getElementById("bull-svg").style.display = "block";
    refreshData();

    document.getElementById("filter-button").addEventListener("click", () => refreshData(1));
    document.getElementById("dark-mode-toggle").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
    document.getElementById("ca-filter").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            refreshData(1);
        }
    });
};
