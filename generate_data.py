import csv
import random
from datetime import datetime, timedelta

random.seed(42)

products = [
    ("PROD-101", "Aura Noise-Canceling Headphones", "Electronics", 179.99),
    ("PROD-102", "Nova Mechanical RGB Keyboard", "Electronics", 129.50),
    ("PROD-103", "Apex Ultra-Slim 4K Webcam", "Electronics", 89.00),
    ("PROD-104", "Pulse Smart Fitness Band", "Electronics", 69.99),
    ("PROD-201", "Eco-Weave Oversized Cotton Hoodie", "Apparel & Fashion", 74.00),
    ("PROD-202", "Merino Wool Everyday Crewneck", "Apparel & Fashion", 98.00),
    ("PROD-203", "Tailored Technical Chino Pants", "Apparel & Fashion", 85.00),
    ("PROD-204", "Minimalist Leather City Tote", "Apparel & Fashion", 145.00),
    ("PROD-205", "Polarized Acetate Sunglasses", "Apparel & Fashion", 62.00),
    ("PROD-301", "Ceramic Pour-Over Coffee Brewer", "Home & Kitchen", 42.50),
    ("PROD-302", "Stainless Insulated Thermal Bottle", "Home & Kitchen", 34.00),
    ("PROD-303", "Japanese Chef Damascus Knife 8-in", "Home & Kitchen", 115.00),
    ("PROD-304", "French Flax Linen Bedding Set", "Home & Kitchen", 185.00),
    ("PROD-305", "Aromatherapy Ultrasonic Diffuser", "Home & Kitchen", 48.00),
    ("PROD-401", "Hydrating Botanical Face Serum", "Beauty & Personal Care", 38.00),
    ("PROD-402", "Vitamin C Brightening Moisturizer", "Beauty & Personal Care", 44.00),
    ("PROD-403", "Exfoliating Bamboo Body Polish", "Beauty & Personal Care", 29.50),
    ("PROD-501", "High-Density Non-Slip Yoga Mat", "Fitness & Outdoors", 55.00),
    ("PROD-502", "Adjustable Quick-Lock Dumbbells", "Fitness & Outdoors", 199.00),
    ("PROD-503", "Waterproof Trail Running Pack", "Fitness & Outdoors", 78.00),
]

countries = [
    ("United States", "North America", 0.48),
    ("Canada", "North America", 0.16),
    ("United Kingdom", "Europe", 0.14),
    ("Germany", "Europe", 0.09),
    ("Australia", "Asia-Pacific", 0.08),
    ("France", "Europe", 0.05),
]

channels = ["Organic Search", "Google Ads", "Facebook / Instagram", "Email Campaign", "Direct", "TikTok Influencer"]
channel_weights = [0.24, 0.22, 0.20, 0.16, 0.10, 0.08]

payments = ["Shopify Pay", "Credit Card", "PayPal", "Apple Pay", "Klarna"]
payment_weights = [0.32, 0.28, 0.18, 0.14, 0.08]

first_names = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Sophia", "Elijah", "Isabella", "Lucas", "Mia", "Henry", "Harper", "Alexander", "Evelyn", "James", "Amelia", "Benjamin", "Charlotte", "William", "Ella", "Daniel", "Grace", "Matthew", "Chloe", "Samuel", "Zoe", "David", "Hannah", "Joseph"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

# Pool of 260 unique customers
customers = []
for i in range(1, 261):
    c_id = f"CUST-{1000 + i}"
    c_name = f"{random.choice(first_names)} {random.choice(last_names)}"
    c_country, c_region, _ = random.choices(countries, weights=[c[2] for c in countries])[0]
    customers.append({"id": c_id, "name": c_name, "country": c_country, "region": c_region})

start_date = datetime(2023, 1, 1)
end_date = datetime(2024, 3, 31)
date_range_days = (end_date - start_date).days

records = []
order_counter = 5001

for i in range(720):
    order_id = f"SHP-{order_counter}"
    order_counter += 1
    
    # Seasonality weight: Q4 higher sales
    day_offset = random.randint(0, date_range_days)
    order_dt = start_date + timedelta(days=day_offset)
    # Give boost to Black Friday / November - December
    if order_dt.month in [11, 12] and random.random() < 0.25:
        # extra chance to duplicate peak date
        pass
        
    date_str = order_dt.strftime("%Y-%m-%d")
    
    # Select customer (some repeat buyers)
    cust = random.choice(customers)
    
    prod = random.choice(products)
    p_id, p_name, p_cat, unit_price = prod
    
    qty = random.choices([1, 2, 3, 4], weights=[0.68, 0.22, 0.07, 0.03])[0]
    
    # Discount
    discount_rate = random.choices([0.0, 0.05, 0.10, 0.15, 0.20, 0.25], weights=[0.45, 0.15, 0.18, 0.12, 0.07, 0.03])[0]
    
    subtotal = qty * unit_price
    revenue = round(subtotal * (1.0 - discount_rate), 2)
    
    shipping = 0.0 if revenue > 100 else random.choice([4.99, 7.99, 9.99])
    
    channel = random.choices(channels, weights=channel_weights)[0]
    payment = random.choices(payments, weights=payment_weights)[0]
    
    # Return status: ~7.5% returns, slightly higher in Apparel
    return_chance = 0.11 if p_cat == "Apparel & Fashion" else 0.06
    return_status = "Returned" if random.random() < return_chance else "Completed"
    
    # Rating: 1 to 5, sometimes missing
    if random.random() < 0.08:
        rating = ""  # realistic missing value
    else:
        if return_status == "Returned":
            rating = random.choices([1, 2, 3, 4], weights=[0.40, 0.35, 0.15, 0.10])[0]
        else:
            rating = random.choices([3, 4, 5], weights=[0.12, 0.38, 0.50])[0]
            
    records.append({
        "order_id": order_id,
        "order_date": date_str,
        "customer_id": cust["id"],
        "customer_name": cust["name"],
        "country": cust["country"],
        "region": cust["region"],
        "product_id": p_id,
        "product_name": p_name,
        "category": p_cat,
        "quantity": qty,
        "unit_price": unit_price,
        "discount": discount_rate,
        "revenue": revenue,
        "shipping_cost": shipping,
        "payment_method": payment,
        "acquisition_channel": channel,
        "rating": rating,
        "return_status": return_status
    })

# Add 2 duplicate records intentionally so Data Quality cleaner can identify and resolve them
records.append(records[10].copy())
records.append(records[42].copy())

# Add a slight whitespace issue in 2 names
records[15]["customer_name"] = "  " + records[15]["customer_name"] + " "
records[25]["product_name"] = records[25]["product_name"] + "   "

headers = list(records[0].keys())

for path in ["data/sample_shopify_sales.csv", "shopify-sales-analytics/data/sample_shopify_sales.csv"]:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(records)

print(f"Successfully generated {len(records)} records in sample CSVs.")
