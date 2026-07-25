// =====================================
// Live Order Tracking
// =====================================

async function trackOrder() {

    const orderId = localStorage.getItem("currentOrderId");

    if (!orderId) {
        return;
    }

    try {

        const response = await fetch(`/order/${orderId}`);
        const order = await response.json();

        if (!order.success || order.message === "Order Not Found") {
            return;
        }

        document.getElementById("order-status-card").style.display = "block";

        document.getElementById("status-table").textContent = order.table;
        document.getElementById("status-payment").textContent = order.payment;
        document.getElementById("status-total").textContent = order.total;

        document.getElementById("status-text").textContent = order.status;


        if (order.status === "Completed") {

            clearInterval(countdownInterval);

            document.getElementById("status-time").textContent =
                "🍽 Enjoy your meal!";

        } 
        else {

            if (currentEstimate !== order.estimated_time) {

                currentEstimate = order.estimated_time;

                startCountdown(order.estimated_time);

            }

        }


    } catch (error) {

        console.log("Tracking Error:", error);

    }

}


// Start Tracking Existing Order
trackOrder();


// Refresh Every 2 Seconds
setInterval(trackOrder, 2000);


// =====================================
// Reset Order
// =====================================

function resetOrder() {

    localStorage.removeItem("currentOrderId");

    document.getElementById("order-status-card").style.display = "none";

    clearInterval(countdownInterval);

    currentEstimate = -1;

}


// Attach Reset Button
const resetBtn = document.getElementById("reset-order");

if (resetBtn) {

    resetBtn.addEventListener("click", resetOrder);

}


// =====================================
// Live Countdown Timer
// =====================================

function startCountdown(minutes) {

    clearInterval(countdownInterval);

    let seconds = minutes * 60;


    countdownInterval = setInterval(() => {


        if (seconds <= 0) {

            clearInterval(countdownInterval);

            document.getElementById("status-time").textContent =
                "Ready 🍽️";

            return;

        }


        let mins = Math.floor(seconds / 60);

        let secs = seconds % 60;


        document.getElementById("status-time").textContent =
            `${mins}m ${secs.toString().padStart(2, "0")}s`;


        seconds--;


    }, 1000);

}

// Cart Drawer Open/Close
const cartBtn = document.getElementById("cart-btn");
const cartPanel = document.getElementById("cart-panel");
const closeCartBtn = document.getElementById("close-cart");

cartBtn.addEventListener("click", () => cartPanel.classList.add("active"));
closeCartBtn.addEventListener("click", () => cartPanel.classList.remove("active"));

// Cart Logic
const cartItemsContainer = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const cartSaved = document.getElementById("cart-saved");

let cart = [];

function updateCart() {
  cartItemsContainer.innerHTML = "";
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "0";
    cartCount.textContent = "0";
    cartSaved.textContent = "0";
    return;
  }

  let total = 0;
  let saved = 0;

  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span>${item.name}</span>
      <span>₹${item.price}</span>
    `;
    cartItemsContainer.appendChild(div);
    total += item.price;
    saved += (item.original - item.price); // savings
  });

  cartTotal.textContent = total;
  cartCount.textContent = cart.length;
  cartSaved.textContent = saved;
}

document.querySelectorAll(".add-cart").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price),
      original: parseFloat(btn.dataset.original)
    };
    cart.push(item);
    updateCart();
  });
});

// Place Order
const placeOrderBtn = document.getElementById("place-order");
const orderStatusCard = document.getElementById("order-status-card");

let countdownInterval;
let currentEstimate = -1;

placeOrderBtn.addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const tableNo = document.getElementById("table-number").value || "-";
  const paymentMethod = document.querySelector("input[name='payment']:checked").value;
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  // Send order to backend
  const response = await fetch("/place_order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: tableNo,
      payment: paymentMethod,
      total: total,
      items: cart,
      status: "Preparing",
      estimated_time: 12
    })
  });

  const data = await response.json();
  if (data.success) {
    // Update customer order status card
    document.getElementById("status-table").textContent = tableNo;
    document.getElementById("status-payment").textContent = paymentMethod;
    document.getElementById("status-total").textContent = total;
    document.getElementById("status-text").textContent = "Preparing";

    orderStatusCard.classList.remove("hidden");
    startCountdown(12);

    // Clear cart
    cart = [];
    updateCart();
    cartPanel.classList.remove("active");

    // Save orderId for tracking
    localStorage.setItem("currentOrderId", data.order_id);
  } else {
    alert("Failed to place order!");
  }
});
