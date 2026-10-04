const backendStatus = document.getElementById("backend-status");
const databaseStatus = document.getElementById("database-status");
const serverTime = document.getElementById("server-time");
const counter = document.getElementById("counter");
const incrementButton = document.getElementById("increment-button");

// Currency conversion stuff
const currencyAmount = document.getElementById("currency-amount");
const currencyFrom = document.getElementById("currency-from");
const currencyTo = document.getElementById("currency-to");
const convertButton = document.getElementById("convert-button");
const currencyResult = document.getElementById("currency-result");
const currencyStatus = document.getElementById("currency-api-status");

async function loadStatus() {
    try {
        const response = await fetch("/api/status");

        if (!response.ok) {
            throw new Error("Request failed");
        }

        const data = await response.json();

        backendStatus.textContent = data.backend;
        databaseStatus.textContent = data.database;
        serverTime.textContent = new Date(data.serverTime).toLocaleString();
        currencyStatus.textContent = data.currency;
        counter.textContent = data.counter;
    } catch (error) {
        console.error(error);

        backendStatus.textContent = "error";
        databaseStatus.textContent = "unknown";
        serverTime.textContent = "-";
        currencyStatus.textContent = "error";
        counter.textContent = "-";
    }
}

async function incrementCounter() {
    incrementButton.disabled = true;

    try {
        const response = await fetch("/api/counter/increment", {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("Request failed");
        }

        const data = await response.json();

        counter.textContent = data.counter;
    } catch (error) {
        console.error(error);
        alert("Could not update counter.");
    } finally {
        incrementButton.disabled = false;
    }
}

// Currency conversion funcs
async function loadCurrencies() {
    try {
        const response = await fetch("/api/currency/currencies");

        if (!response.ok) {
            throw new Error("Could not load currencies");
        }

        const data = await response.json();

        currencyFrom.innerHTML = "";
        currencyTo.innerHTML = "";

        data.currencies.forEach(currency => {
            const text = `${currency.code} - ${currency.name}`;

            const fromOption = document.createElement("option");
            fromOption.value = currency.code;
            fromOption.textContent = text;

            const toOption = document.createElement("option");
            toOption.value = currency.code;
            toOption.textContent = text;

            currencyFrom.appendChild(fromOption);
            currencyTo.appendChild(toOption);
        });

        currencyFrom.value = "EUR";
        currencyTo.value = "USD";
    } catch (error) {
        console.error(error);
        currencyResult.textContent = "Could not load currencies.";
    }
}

async function convertCurrency() {
    const amount = Number(currencyAmount.value);
    const from = currencyFrom.value;
    const to = currencyTo.value;

    if (!Number.isFinite(amount) || amount <= 0) {
        currencyResult.textContent = "Enter an amount greater than zero.";
        return;
    }

    convertButton.disabled = true;
    currencyResult.textContent = "Loading...";

    try {
        const params = new URLSearchParams({
            amount: amount.toString(),
            from,
            to
        });

        const response = await fetch(
            `/api/currency/convert?${params}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Conversion failed");
        }

        currencyResult.textContent =
            `${data.amount} ${data.from} = ${data.result} ${data.to}`;
    } catch (error) {
        console.error(error);
        currencyResult.textContent = "Could not convert currency.";
    } finally {
        convertButton.disabled = false;
    }
}

incrementButton.addEventListener("click", incrementCounter);
convertButton.addEventListener("click", convertCurrency);

loadStatus();
loadCurrencies();

const topTabs = document.querySelectorAll(".top-tab");
const topPanels = document.querySelectorAll(".top-panel");

topTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const selectedTab = tab.dataset.topTab;

        topTabs.forEach(currentTab => {
            const isActive = currentTab === tab;

            currentTab.classList.toggle("active", isActive);
            currentTab.setAttribute("aria-selected", isActive);
        });

        topPanels.forEach(panel => {
            panel.classList.toggle(
                "hidden",
                panel.id !== `top-${selectedTab}`
            );
        });

        if (["week4", "week5", "week6"].includes(selectedTab)) {
            const activePanel = document.getElementById(`top-${selectedTab}`);
            const firstTab = activePanel.querySelector(".week-tab");
            activateWeekTab(activePanel, firstTab);
        }
    });
});


const weekTabs = document.querySelectorAll(".week-tab");

weekTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const parentPanel = tab.closest(".top-panel");

        activateWeekTab(parentPanel, tab);
    });
});


function activateWeekTab(parentPanel, selectedTab) {
    const tabs = parentPanel.querySelectorAll(".week-tab");
    const panels = parentPanel.querySelectorAll(".week-tab-panel");
    const target = selectedTab.dataset.target;

    tabs.forEach(tab => {
        const isActive = tab === selectedTab;

        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", isActive);
    });

    panels.forEach(panel => {
        panel.classList.toggle(
            "hidden",
            panel.id !== target
        );
    });
}

// Markdown texts for diagram representation

const week4Architecture = `
\`\`\`text
Internet
   |
   v
Rahti Route
   |
   v
Frontend Service
   |
   v
Frontend Pod
   |
   v
Backend Service
   |
   v
Backend Pod
   |
   v
MySQL Service
   |
   v
MySQL Pod
   |
   v
Persistent Volume
\`\`\`
`;

const week5Architecture = `
\`\`\`text
Internet
   |
   v
Rahti Route
   |
   v
Frontend Service
   |
   v
Frontend Pod
   |
   v
Backend Service
   |
   v
Backend Pod ---------------
   |                       |
   v                       v
MySQL Service        Currency Service
   |                       |
   v                       v
MySQL Pod             Currency Service Pod
   |                       |
   v                       v
Persistent Volume     Frankfurter API
\`\`\`
`;

const week4ArchitectureElement =
    document.getElementById("week4-architecture");

const week5ArchitectureElement =
    document.getElementById("week5-architecture");

if (week4ArchitectureElement) {
    week4ArchitectureElement.innerHTML =
        marked.parse(week4Architecture);
}

if (week5ArchitectureElement) {
    week5ArchitectureElement.innerHTML =
        marked.parse(week5Architecture);
}

// Version data update
async function loadVersions() {
    try {
        const frontendResponse = await fetch("/version");
        const frontend = await frontendResponse.json();

        document.getElementById("frontend-version").textContent =
            frontend.version;
    } catch {
        document.getElementById("frontend-version").textContent =
            "Unavailable";
    }

    try {
        const backendResponse = await fetch("/api/version");
        const backend = await backendResponse.json();

        document.getElementById("backend-version").textContent =
            backend.version;
    } catch {
        document.getElementById("backend-version").textContent =
            "Unavailable";
    }

    try {
        const currencyResponse = await fetch("/api/currency/version");
        const currency = await currencyResponse.json();

        document.getElementById("currency-version").textContent =
            currency.version;
    } catch {
        document.getElementById("currency-version").textContent =
            "Unavailable";
    }
}

loadVersions();