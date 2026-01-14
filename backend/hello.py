from flask import Flask, jsonify, request
from google import genai
import os
from flask_cors import CORS
from google import genai
from google.genai import types
import sqlite3
from flask import g

DATABASE = '/Users/alexdeutch/Documents/code/stryker-project/backend/database.db'

app = Flask(__name__)
CORS(app, origins="http://localhost:3000")

geminiKey = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=geminiKey)

headerKeys = 'OrderDate, DueDate, ShipDate, Invoice Number as SalesOrderNumber, AccountNumber, Subtotal, TaxAmt, Freight, TotalDue'
detailKeys = 'ProductID, OrderQty, UnitPrice, LineTotal'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

def init_db():
    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            OrderDate TEXT,
            DueDate TEXT,
            ShipDate TEXT,
            SalesOrderNumber TEXT,
            AccountNumber TEXT,
            Subtotal REAL,
            TaxAmt REAL,
            Freight REAL,
            TotalDue REAL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoice_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER,
            ProductID INTEGER,
            OrderQty INTEGER,
            UnitPrice REAL,
            LineTotal REAL,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id)
        )
    ''')
    db.commit()
    print('Initialized the database.')

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route("/upload", methods=["POST"])
def upload():
    reqData = request.get_data()
    aiResponse = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[
        types.Part.from_bytes(
            data=reqData,
            mime_type='image/png'
        ),
        f"Extract the following fields from the above invoice PDF as a JSON object. Provide raw JSON only. Do not include markdown formatting or backticks. Provide two objects, one object named headers and an array containing detailKey objects for each row in the invoice named details: {headerKeys}, {detailKeys}"
        ]
    )
    response = aiResponse.text
    print(response)
    return response

@app.route("/submit", methods=["POST"])
def submit():
    data = request.get_json()
    headers = data['headers']
    details = data['details']

    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO invoices (OrderDate, DueDate, ShipDate, SalesOrderNumber, AccountNumber, Subtotal, TaxAmt, Freight, TotalDue)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        headers['OrderDate'],
        headers['DueDate'],
        headers['ShipDate'],
        headers['SalesOrderNumber'],
        headers['AccountNumber'],
        headers['Subtotal'],
        headers['TaxAmt'],
        headers['Freight'],
        headers['TotalDue']
    ))
    invoice_id = cursor.lastrowid

    for item in details:
        cursor.execute("""
            INSERT INTO invoice_details (invoice_id, ProductID, OrderQty, UnitPrice, LineTotal)
            VALUES (?, ?, ?, ?, ?)
        """, (
            invoice_id,
            item['ProductID'],
            item['OrderQty'],
            item['UnitPrice'],
            item['LineTotal']
        ))

    db.commit()
    return jsonify({"status": "success", "invoice_id": invoice_id})

@app.cli.command("init-db")
def init_db_command():
    """Clear existing data and create new tables."""
    init_db()
    print("Initialized the database.")