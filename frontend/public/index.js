const backendStatus = document.getElementById("backend-status");
const databaseStatus = document.getElementById("database-status");
const serverTime = document.getElementById("server-time");
const counter = document.getElementById("counter");
const incrementButton = document.getElementById("increment-button");

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
        counter.textContent = data.counter;
    } catch (error) {
        console.error(error);

        backendStatus.textContent = "error";
        databaseStatus.textContent = "unknown";
        serverTime.textContent = "-";
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

incrementButton.addEventListener("click", incrementCounter);

loadStatus();