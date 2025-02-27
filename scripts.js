import { dbData } from './db.js';

let currentPage = 1;
let totalPages = 1;

// Simulate API filtering and pagination
function filterData(startDate, endDate, page = 1) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000; // Include end day
    const filtered = dbData
        .map(row => ({
            date: row[0],
            contract: row[1],
            first_reply: row[2],
            first_reply_time: row[3],
            final_reply: row[4],
            final_reply_time: row[5]
        }))
        .filter(item => {
            const itemDate = new Date(item.date).getTime();
            return itemDate >= start && itemDate < end;
        });

    const pageSize = 100;
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedData = filtered.slice(startIdx, endIdx);

    const wins = filtered.filter(item => item.first_reply !== null).length;
    const losses = filtered.length - wins;

    return {
        data: paginatedData,
        wins: wins,
        losses: losses,
        total_pages: Math.ceil(filtered.length / pageSize),
        current_page: page
    };
}

function updateTable(data) {
    const tbody = document.querySelector("#data-table tbody");
    tbody.innerHTML = "";
    data.forEach(item => {
        const row = document.createElement("tr");
        row.className = item.first_reply ? "win" : "loss";
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.contract}</td>
            <td>${item.first_reply || "N/A"}</td>
            <td>${item.first_reply_time || "N/A"}</td>
            <td>${item.final_reply || "N/A"}</td>
            <td>${item.final_reply_time || "N/A"}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateStats(wins, losses) {
    document.getElementById("wins").textContent = wins;
    document.getElementById("losses").textContent = losses;
}

function updatePieChart(wins, losses) {
    const chartContainer = document.getElementById("pie-chart");
    chartContainer.innerHTML = "";
    const canvas = document.createElement("canvas");
    chartContainer.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Wins", "Losses"],
            datasets: [{
                data: [wins, losses],
                backgroundColor: ["#2ecc71", "#e74c3c"],
                borderColor: ["#27ae60", "#c0392b"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "top" } }
        }
    });
}

function updatePagination(current, total) {
    totalPages = total;
    currentPage = current;
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
    `;
}

async function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    await refreshData(newPage);
}

async function refreshData(page = 1) {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const loading = document.getElementById("loading");
    const bullSvg = document.getElementById("bull-svg");

    loading.style.display = "block";
    bullSvg.style.display = "none";

    const result = filterData(startDate, endDate, page);
    if (result) {
        updateTable(result.data);
        updateStats(result.wins, result.losses);
        updatePieChart(result.wins, result.losses);
        updatePagination(result.current_page, result.total_pages);
        bullSvg.style.display = "none";
    }

    loading.style.display = "none";
}

window.onload = () => {
    document.getElementById("bull-svg").style.display = "block";
    refreshData();
};
