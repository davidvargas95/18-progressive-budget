const { get } = require("mongoose");

let db;

const request = indexedDB.open("budget", 1);

request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore("transaction", { autoIncrement: true });
};

request.onsuccess = (event) => {
    db = event.target.result;

    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = (event) => {
    console.log(`Error ${event.target.errorCode}`);
};

const saveTransaction = (data) => {
    const transaction = db.transaction(["transaction"], "readwrite");
    const store = transaction.objectStore("transaction");

    store.add(data);
};

function checkDatabase() {
    const transaction = db.transaction( ["transaction"], "readwrite");
    const store = transaction.objectStore("transaction");
    const getAll = store.getAll();

    getAll.onsuccess = async () => {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            }).then(response => response.json())
            .then(() => {
                const transaction = db.transaction(["transaction"], "readwrite");
                const store = transaction.objectStore("transaction");

                store.clear();
            })
        }
    }
}

window.addEventListener("online", checkDatabase);