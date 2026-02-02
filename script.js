import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBFYubxSUHpP6g5Vvwt65gsWXDr5Ux535o",
    authDomain: "lumiere-erp.firebaseapp.com",
    projectId: "lumiere-erp",
    storageBucket: "lumiere-erp.firebasestorage.app",
    messagingSenderId: "78622005633",
    appId: "1:78622005633:web:c231e3862e13787686b080",
    measurementId: "G-DQHWX53TQD",
    databaseURL: "https://lumiere-erp-default-rtdb.firebaseio.com" 
};

const app = initializeApp(firebaseConfig);
const db_fb = getDatabase(app);

window.MENU = [
    { id: 1, name: "Momo", price: 15, cat: "Starters", stock: true },
    { id: 2, name: "Spring Roll", price: 10, cat: "Starters", stock: true },
    { id: 3, name: "Pasta Carbonara", price: 45, cat: "Mains", stock: true },
    { id: 4, name: "Ribeye Steak", price: 120, cat: "Mains", stock: true },
    { id: 5, name: "Red Wine", price: 300, cat: "Drinks", stock: true },
    { id: 6, name: "Chicken Choila Khaja Set", price: 250, cat: "Drinks", stock: true },
    { id: 7, name: "Buff Choila Khaja Set", price: 220, cat: "Drinks", stock: true },
    { id: 8, name: "Peanut Sadeko", price: 120, cat: "Drinks", stock: true },
    { id: 9, name: "Iced Tea", price: 50, cat: "Drinks", stock: true }
];

let tablesData = [];
let salesData = [];
let creditsData = [];
let statsData = {};

onValue(ref(db_fb, 'tables'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
        tablesData = data;
    } else {
        const init = Array.from({ length: 50 }, (_, i) => ({
            id: i + 1, status: 'available', orders: [], isVIP: false
        }));
        set(ref(db_fb, 'tables'), init);
        tablesData = init;
    }
    if (typeof window.renderTables === "function") window.renderTables();
    if (typeof window.renderCart === "function") window.renderCart();
    if (typeof window.renderAdmin === "function") window.renderAdmin();
    if (typeof window.renderKDS === "function") window.renderKDS();
});

onValue(ref(db_fb, 'sales'), (s) => salesData = Object.values(s.val() || {}));
onValue(ref(db_fb, 'credits'), (s) => creditsData = Object.values(s.val() || {}));
onValue(ref(db_fb, 'stats'), (s) => statsData = s.val() || {});

window.getDB = () => tablesData;
window.saveDB = (data) => set(ref(db_fb, 'tables'), data);
window.getSales = () => salesData;
window.getCredits = () => creditsData;
window.saveCredits = (data) => set(ref(db_fb, 'credits'), data);
window.getItemStats = () => statsData;

window.addItem = (menuId, isRush = false) => {
    const item = window.MENU.find(m => m.id === menuId);
    const db = window.getDB();
    const table = db[window.activeId - 1];
    const note = prompt(`Note for ${item.name}:`) || "";
    const existing = table.orders.find(o => o.id === menuId && o.note === note && !o.fired);
    if (existing) { existing.qty += 1; } 
    else {
        table.orders.push({ 
            ...item, qty: 1, note, fired: false, isServed: false, isRush, 
            time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            ts: Date.now()
        });
    }
    table.status = 'occupied';
    window.saveDB(db);
};

window.removeItem = (orderTs) => {
    const db = window.getDB();
    const table = db[window.activeId - 1];
    const idx = table.orders.findIndex(o => o.ts === orderTs);
    if (idx > -1 && !table.orders[idx].fired) {
        if (table.orders[idx].qty > 1) table.orders[idx].qty -= 1;
        else table.orders.splice(idx, 1);
        if (table.orders.length === 0) table.status = 'available';
        window.saveDB(db);
    }
};

window.fireOrder = () => {
    const db = window.getDB();
    const table = db[window.activeId - 1];
    if(!table.orders.some(o => !o.fired)) return alert("Add items first!");
    table.orders.forEach(o => o.fired = true);
    table.status = 'cooking';
    window.saveDB(db);
    if (typeof window.toggleDrawer === "function") window.toggleDrawer(null);
};

window.saveDetailedSale = (sale, orders = []) => {
    push(ref(db_fb, 'sales'), { ...sale, ts: Date.now(), date: new Date().toLocaleDateString() });
    orders.forEach(item => {
        statsData[item.name] = (statsData[item.name] || 0) + item.qty;
    });
    set(ref(db_fb, 'stats'), statsData);
};