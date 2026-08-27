from flask import Flask, render_template, request, jsonify
import uuid
from datetime import datetime

app = Flask(__name__)

# ==================================================
# MENU DATABASE (Temporary)
# ==================================================
menu = [
    {
        "id": 1,
        "name": "Margherita Pizza",
        "category": "Pizza",
        "original_price": 299,
        "offer": 50,
        "price": 249,
        "prep_time": 15,
        "description": "Classic Cheese Pizza",
        "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500"
    },
    {
        "id": 2,
        "name": "Cheese Burger",
        "category": "Burger",
        "original_price": 219,
        "offer": 20,
        "price": 199,
        "prep_time": 10,
        "description": "Loaded with Cheese",
        "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500"
    },
    {
        "id": 3,
        "name": "Brownie",
        "category": "Dessert",
        "original_price": 149,
        "offer": 0,
        "price": 149,
        "prep_time": 8,
        "description": "Chocolate Brownie",
        "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500"
    }
]

# ==================================================
# ORDERS DATABASE (Temporary)
# ==================================================
orders = []

# ==================================================
# PAGES
# ==================================================
@app.route("/")
def home():
    return render_template("customer.html", menu=menu)

@app.route("/kitchen")
def kitchen():
    return render_template("kitchen.html")

@app.route("/admin")
def admin():
    return render_template("admin.html")

# ==================================================
# MENU APIs
# ==================================================
@app.route("/menu")
def get_menu():
    return jsonify(menu)

@app.route("/add_food", methods=["POST"])
def add_food():
    data = request.get_json()
    food = {
        "id": max([f["id"] for f in menu], default=0) + 1,
        "name": data["name"],
        "category": data["category"],
        "original_price": int(data["original_price"]),
        "offer": int(data["offer"]),
        "price": int(data["price"]),
        "prep_time": int(data["prep_time"]),
        "description": data["description"],
        "image": data["image"]
    }
    menu.append(food)
    return jsonify({"success": True, "message": "Food Added Successfully"})

@app.route("/food/<int:id>")
def get_food(id):
    for food in menu:
        if food["id"] == id:
            return jsonify(food)
    return jsonify({"success": False, "message": "Food Not Found"}), 404

@app.route("/update_food/<int:id>", methods=["PUT"])
def update_food(id):
    data = request.get_json()
    for food in menu:
        if food["id"] == id:
            food.update({
                "name": data["name"],
                "category": data["category"],
                "original_price": int(data["original_price"]),
                "offer": int(data["offer"]),
                "price": int(data["price"]),
                "prep_time": int(data["prep_time"]),
                "description": data["description"],
                "image": data["image"]
            })
            return jsonify({"success": True, "message": "Food Updated Successfully"})
    return jsonify({"success": False, "message": "Food Not Found"}), 404

@app.route("/delete_food/<int:id>", methods=["DELETE"])
def delete_food(id):
    global menu
    menu = [food for food in menu if food["id"] != id]
    return jsonify({"success": True, "message": "Food Deleted Successfully"})

# ==================================================
# ORDER APIs
# ==================================================
@app.route("/place_order", methods=["POST"])
def place_order():
    data = request.get_json()
    data["order_id"] = str(uuid.uuid4())[:8]
    data["created_at"] = datetime.now().isoformat()
    data["completed"] = False
    if "status" not in data:
        data["status"] = "Preparing"

    max_time = 0
    for item in data["items"]:
        for food in menu:
            if int(food["id"]) == int(item["id"]):
                max_time = max(max_time, food["prep_time"])
    data["estimated_time"] = max_time
    orders.append(data)

    return jsonify({"success": True, "order_id": data["order_id"], "estimated_time": max_time})

@app.route("/orders")
def get_orders():
    active_orders = [o for o in orders if not o.get("completed", False)]
    return jsonify(active_orders)

@app.route("/completed_orders")
def completed_orders():
    done_orders = [o for o in orders if o.get("completed", False)]
    return jsonify([{"table": o["table"], "order_id": o["order_id"]} for o in done_orders])

@app.route("/order/<order_id>")
def get_order(order_id):
    for order in orders:
        if order["order_id"] == order_id:
            created = datetime.fromisoformat(order["created_at"])
            elapsed = int((datetime.now() - created).total_seconds())
            total_seconds = order["estimated_time"] * 60
            remaining = max(total_seconds - elapsed, 0)
            order["remaining_seconds"] = remaining
            return jsonify(order)
    return jsonify({"success": False, "message": "Order Not Found"}), 404

@app.route("/update_status", methods=["POST"])
def update_status():
    data = request.get_json()
    order_id = data.get("order_id")
    for order in orders:
        if order["order_id"] == order_id:
            order["status"] = data["status"]
            order["estimated_time"] = int(data["estimated_time"])
            if order["status"] == "Completed":
                order["completed"] = True
            return jsonify({"success": True})
    return jsonify({"success": False, "message": "Order not found"}), 404

@app.route("/complete_order/<order_id>", methods=["POST"])
def complete_order(order_id):
    for order in orders:
        if order["order_id"] == order_id:
            order["status"] = "Completed"
            order["completed"] = True
            return jsonify({"success": True, "message": "Order Completed"})
    return jsonify({"success": False, "message": "Invalid Order"}), 404

# ==================================================
# ADMIN DASHBOARD STATS
# ==================================================
@app.route("/stats")
def stats():
    active_orders = len([o for o in orders if not o.get("completed", False)])
    total_orders = len(orders)
    total_sales = sum(order["total"] for order in orders if order.get("payment"))
    return jsonify({
        "active_orders": active_orders,
        "total_orders": total_orders,
        "total_sales": total_sales,
        "menu_items": len(menu)
    })

# ==================================================
# SALES TRACKER
# ==================================================
sales_total = 0
sales_orders = []

@app.route("/sales")
def get_sales():
    global sales_total, sales_orders
    return jsonify({"orders": sales_orders, "total": sales_total})

@app.route("/update_sales", methods=["POST"])
def update_sales():
    global sales_total, sales_orders
    data = request.get_json()
    sales_orders.append(data)
    sales_total += data.get("total", 0)
    return jsonify({"success": True})

@app.route("/reset_sales", methods=["POST"])
def reset_sales():
    global sales_total, sales_orders
    sales_total = 0
    sales_orders = []
    return jsonify({"success": True, "message": "Sales reset"})

# ==================================================
# RUN SERVER
# ==================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

