// ===============================
// TABLEQ ADMIN PANEL (with Sales Tracker)
// ===============================

let editId = null;

loadMenu();
loadSales();

document.getElementById("add-food-btn").addEventListener("click", saveFood);

// -----------------------------
// Add / Update Food
// -----------------------------
function saveFood() {
  const food = {
    name: document.getElementById("food-name").value,
    category: document.getElementById("food-category").value,
    original_price: document.getElementById("food-original").value,
    offer: document.getElementById("food-offer").value,
    price: document.getElementById("food-price").value,
    prep_time: document.getElementById("food-time").value,
    description: document.getElementById("food-description").value,
    image: document.getElementById("food-image").value
  };

  if (
    food.name === "" ||
    food.original_price === "" ||
    food.price === "" ||
    food.description === "" ||
    food.image === ""
  ) {
    alert("Please fill all required fields.");
    return;
  }

  if (editId === null) {
    // ADD FOOD
    fetch("/add_food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(food)
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        clearForm();
        loadMenu();
      });
  } else {
    // UPDATE FOOD
    fetch("/update_food/" + editId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(food)
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        editId = null;
        document.getElementById("add-food-btn").textContent = "➕ Add Food";
        clearForm();
        loadMenu();
      });
  }
}

// -----------------------------
// Load Menu
// -----------------------------
function loadMenu() {
  fetch("/menu")
    .then(res => res.json())
    .then(menu => {
      const list = document.getElementById("menu-list");
      list.innerHTML = "";

      if (menu.length === 0) {
        list.innerHTML = "<p>No Food Items Yet.</p>";
        return;
      }

      menu.forEach(food => {
        list.innerHTML += `
          <div class="menu-card">
            <img src="${food.image}" width="90" height="90" style="border-radius:10px;object-fit:cover;">
            <div class="menu-info">
              <h3>${food.name}</h3>
              <p>${food.category}</p>
              <p>₹${food.price}</p>
            </div>
            <div>
              <button onclick="editFood(${food.id})">✏ Edit</button>
              <button onclick="deleteFood(${food.id})">🗑 Delete</button>
            </div>
          </div>
        `;
      });
    });
}

// -----------------------------
// Edit Food
// -----------------------------
function editFood(id) {
  fetch("/food/" + id)
    .then(res => res.json())
    .then(food => {
      editId = id;
      document.getElementById("food-name").value = food.name;
      document.getElementById("food-category").value = food.category;
      document.getElementById("food-original").value = food.original_price;
      document.getElementById("food-offer").value = food.offer;
      document.getElementById("food-price").value = food.price;
      document.getElementById("food-time").value = food.prep_time;
      document.getElementById("food-description").value = food.description;
      document.getElementById("food-image").value = food.image;
      document.getElementById("add-food-btn").textContent = "💾 Update Food";
    });
}

// -----------------------------
// Delete Food
// -----------------------------
function deleteFood(id) {
  if (!confirm("Delete this food item?")) return;
  fetch("/delete_food/" + id, { method: "DELETE" })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadMenu();
    });
}

// -----------------------------
// Clear Form
// -----------------------------
function clearForm() {
  document.getElementById("food-name").value = "";
  document.getElementById("food-original").value = "";
  document.getElementById("food-offer").value = "";
  document.getElementById("food-price").value = "";
  document.getElementById("food-description").value = "";
  document.getElementById("food-image").value = "";
  document.getElementById("food-time").value = "";
  document.getElementById("food-category").selectedIndex = 0;
}

// -----------------------------
// Sales Tracker
// -----------------------------
function loadSales() {
  fetch("/sales")
    .then(res => res.json())
    .then(data => {
      const salesBox = document.getElementById("sales-box");
      salesBox.innerHTML = `
        <h2>💰 Today's Sales</h2>
        <p>Total Orders: ${data.orders.length}</p>
        <p>Total Revenue: ₹${data.total}</p>
        <button onclick="showSales()">📊 Show Sales</button>
        <button onclick="resetSales()">🔄 Reset</button>
      `;
    });
}

function showSales() {
  fetch("/sales")
    .then(res => res.json())
    .then(data => {
      let details = `<h3>Completed Orders</h3>`;
      if (data.orders.length === 0) {
        details += "<p>No sales yet.</p>";
      } else {
        data.orders.forEach(o => {
          details += `<p>Table ${o.table} – ₹${o.total}</p>`;
        });
      }
      alert(details + `\nTotal Revenue: ₹${data.total}`);
    });
}

function resetSales() {
  fetch("/reset_sales", { method: "POST" })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadSales();
    });
}
