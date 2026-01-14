CREATE TABLE invoices (
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

CREATE TABLE invoice_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER,
  ProductID INTEGER,
  OrderQty INTEGER,
  UnitPrice REAL,
  LineTotal REAL,
  FOREIGN KEY(invoice_id) REFERENCES invoices(id)
)