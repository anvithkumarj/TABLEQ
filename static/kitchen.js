// =====================================
// TABLEQ - KITCHEN.JS (Completed Orders + Sales Update)
// =====================================

// Load Active Orders
async function loadOrders() {
  const response = await fetch("/orders");
  const orders = await response.json();
  const container = document.getElementById("orders-container");

  container.innerHTML = "";

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty">
        No Active Orders 🍽️
      </div>
    `;
    return;
  }

  orders.forEach((order, index) => {
    let items = "";
    order.items.forEach(food => {
      items += `<li>🍽 ${food.name}</li>`;
    });

    container.innerHTML += `
      <div class="order-card">
        <h2>🍽 Table ${order.table}</h2>
        <p><strong>Payment:</strong> ${order.payment}</p>
        <ul>${items}</ul>
        <h3>Total ₹${order.total}</h3>

        <label for="status-${index}">Change Status</label>
        <select id="status-${index}">
          <option value="Preparing" ${order.status=="Preparing" ? "selected" : ""}>Preparing</option>
          <option value="Cooking" ${order.status=="Cooking" ? "selected" : ""}>Cooking</option>
          <option value="Ready" ${order.status=="Ready" ? "selected" : ""}>Ready</option>
          <option value="Completed" ${order.status=="Completed" ? "selected" : ""}>Completed</option>
        </select>

        <br><br>

        <label for="time-${index}">Estimated Time (Minutes)</label>
        <input type="number" id="time-${index}" value="${order.estimated_time}" min="0">

        <br><br>

        <button onclick="saveOrder('${order.order_id}', ${index}, ${order.table}, ${order.total})">💾 Save</button>
      </div>
    `;
  });
}

// Save Order (mark as completed + update sales)
async function saveOrder(orderId, index, table, total) {
  const status = document.getElementById(`status-${index}`).value;
  const estimatedTime = document.getElementById(`time-${index}`).value;

  // Update order status
  await fetch("/update_status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      status: status,
      estimated_time: Number(estimatedTime)
    })
  });

  // If marked Completed, also update sales
  if (status === "Completed") {
    await fetch("/update_sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: table,
        total: total
      })
    });
  }

  loadOrders();
  loadCompletedOrders();
}

// Load Completed Orders Section
async function loadCompletedOrders() {
  const response = await fetch("/completed_orders");
  const completed = await response.json();
  const container = document.getElementById("completed-container");

  container.innerHTML = "<h2>✅ Completed Orders</h2>";

  if (completed.length === 0) {
    container.innerHTML += `
      <p class="empty">No Completed Orders Yet</p>
    `;
    return;
  }

  completed.forEach(order => {
    container.innerHTML += `
      <div class="done-card">
        Table ${order.table} – Done ✔
      </div>
    `;
  });
}

// Auto Refresh
loadOrders();
loadCompletedOrders();
setInterval(() => {
  loadOrders();
  loadCompletedOrders();
}, 30000);
