const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

console.log(indexedDB);

let db;

const request = indexedDB.open("budget", 1);

// Creates the object store
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

// Checks our database when we come back online
request.onsuccess = (event) => {
    db = event.target.result;

    if (navigator.onLine) {
        checkDatabase();
    }
};

// Logs an error if coming back online fails
request.onerror = (event) => {
    console.log(`Error ${event.target.errorCode}`);
};

// Caches what we enter while in offline mode
const saveRecord = (data) => {
    const transaction = db.transaction([ "pending" ], "readwrite");
    const store = transaction.objectStore("pending");

    store.add(data);
};

// Checks what was entered while in offline mode
function checkDatabase() {
    const transaction = db.transaction([ "pending" ], "readwrite");
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();

    getAll.onsuccess = async () => {

        console.log(getAll.result);

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
                const transaction = db.transaction(["pending"], "readwrite");
                const store = transaction.objectStore("pending");

                store.clear();
            })
        }
    }
}

window.addEventListener("online", checkDatabase);