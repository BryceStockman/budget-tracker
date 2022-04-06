const IndexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let DB;

const request = IndexedDB.open('budget', 1);

request.onupgradeneeded = ({ target }) => {
  DB = target.result;
  DB.createObjectStore('pending', { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  DB = target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = ({ target }) => {
  console.log(target.errorCode);
};

function saveRecord(transaction) {
  const moneyTransfer = DB.transaction(['pending'], 'readwrite');
  const store = moneyTransfer.objectStore('pending');
  store.add(transaction);
}

function checkDatabase() {
  const moneyTransfer = DB.transaction(['pending'], 'readwrite');
  const store = moneyTransfer.objectStore('pending');
  const total = store.getAll();
  total.onsuccess = function () {
    if (total.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(total.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((data) => {
          return data.json();
        })
        .then(() => {
          const moneyTransfer = DB.transaction(['pending'], 'readwrite');
          const store = moneyTransfer.objectStore('pending');
          store.clear();
        });
    }
  };
}

window.addEventListener('online', checkDatabase);
