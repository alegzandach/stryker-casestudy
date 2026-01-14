import { useState, type ChangeEvent } from "react";
import "./App.css";

type InvoiceWeb = {
  orderDate: string;
  dueDate: string;
  shipDate: string;
  salesOrderNumber: string;
  accountNumber: string;
  subtotal: string;
  taxAmt: string;
  freight: string;
  totalDue: string;
  details: InvoiceDetailWeb[];
};

type InvoiceDetailWeb = {
  productID: string;
  orderQty: string;
  unitPrice: string;
  lineTotal: string;
};

type InvoiceDB = {
  OrderDate: string;
  DueDate: string;
  ShipDate: string;
  SalesOrderNumber: string;
  AccountNumber: string;
  Subtotal: string;
  TaxAmt: string;
  Freight: string;
  TotalDue: string;
};

type InvoiceDetailDB = {
  ProductID: string;
  OrderQty: string;
  UnitPrice: string;
  LineTotal: string;
};

const transformInvoiceDBToWeb = (
  invoice: InvoiceDB,
  invoiceDetails: InvoiceDetailDB[]
) => {
  return {
    orderDate: invoice.OrderDate,
    dueDate: invoice.DueDate,
    shipDate: invoice.ShipDate,
    salesOrderNumber: invoice.SalesOrderNumber,
    accountNumber: invoice.AccountNumber,
    subtotal: invoice.Subtotal,
    taxAmt: invoice.TaxAmt,
    freight: invoice.Freight,
    totalDue: invoice.TotalDue,
    details: invoiceDetails.map((detail) => ({
      productID: detail.ProductID,
      orderQty: detail.OrderQty,
      unitPrice: detail.UnitPrice,
      lineTotal: detail.LineTotal,
    })),
  };
};

const lang = {
  orderDate: "Order Date",
  dueDate: "Due Date",
  shipDate: "Ship Date",
  salesOrderNumber: "Sales Order Number",
  accountNumber: "Account Number",
  subtotal: "Subtotal",
  taxAmt: "Tax Amount",
  freight: "Freight",
  totalDue: "Total Due",
  productID: "Product ID",
  orderQty: "Order Quantity",
  unitPrice: "Unit Price",
  lineTotal: "Line Total",
};

type HeaderProps = keyof Pick<
  InvoiceWeb,
  "orderDate" | "dueDate" | "shipDate" | "salesOrderNumber" | "accountNumber"
>;
const headerProps: HeaderProps[] = [
  "orderDate",
  "dueDate",
  "shipDate",
  "salesOrderNumber",
  "accountNumber",
];
type DetailProps = keyof InvoiceDetailWeb;
const detailProps: DetailProps[] = [
  "productID",
  "orderQty",
  "unitPrice",
  "lineTotal",
];
type TotalProps = keyof Pick<
  InvoiceWeb,
  "subtotal" | "taxAmt" | "freight" | "totalDue"
>;
const totalProps: TotalProps[] = ["subtotal", "taxAmt", "freight", "totalDue"];

function App() {
  const [file, setFile] = useState<File>();
  const [invoiceData, setInvoiceData] = useState<InvoiceWeb>();

  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFile(file);
  };

  const onFieldChange = (
    e: ChangeEvent<HTMLInputElement>,
    prop: keyof InvoiceWeb
  ) => {
    setInvoiceData((invoiceData) => {
      const newInvoiceData = { ...invoiceData } as InvoiceWeb;
      if (prop !== "details") {
        newInvoiceData[prop] = e.target.value;
      }
      return newInvoiceData;
    });
  };

  const onDetailFieldChange = (
    e: ChangeEvent<HTMLInputElement>,
    prop: keyof InvoiceDetailWeb,
    key: number
  ) => {
    setInvoiceData((invoiceData) => {
      const newInvoiceData = { ...invoiceData } as InvoiceWeb;
      newInvoiceData.details[key][prop] = e.target.value;
      return newInvoiceData;
    });
  };

  const onReadInvoice = async () => {
    if (!file) return;
    const response = await fetch("http://localhost:5001/upload", {
      method: "POST",
      body: file,
    });
    const responseJson = await response.json();
    const invoiceWeb = transformInvoiceDBToWeb(
      responseJson.headers,
      responseJson.details
    );
    setInvoiceData(invoiceWeb);
  };

  const onSubmit = async () => {
    const body = transformInvoiceWebToDB(invoiceData!);
    const response = await fetch("http://localhost:5001/submit", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const responseJson = await response.json();
    console.log(responseJson);
  };

  const transformInvoiceWebToDB = (invoice: InvoiceWeb) => {
    return {
      headers: {
        OrderDate: invoice.orderDate,
        DueDate: invoice.dueDate,
        ShipDate: invoice.shipDate,
        SalesOrderNumber: invoice.salesOrderNumber,
        AccountNumber: invoice.accountNumber,
        Subtotal: invoice.subtotal,
        TaxAmt: invoice.taxAmt,
        Freight: invoice.freight,
        TotalDue: invoice.totalDue,
      },
      details: invoice.details.map((detail) => ({
        ProductID: detail.productID,
        OrderQty: detail.orderQty,
        UnitPrice: detail.unitPrice,
        LineTotal: detail.lineTotal,
      })),
    };
  };

  return (
    <>
      <input type="file" onChange={onSelect} />
      <button disabled={!file} onClick={onReadInvoice}>
        Read Invoice
      </button>
      {invoiceData && (
        <>
          <form onSubmit={onSubmit}>
            <h2>Invoice Details</h2>
            {headerProps.map((prop) => (
              <div key={prop}>
                <label>
                  {lang[prop]}:
                  <input
                    type="text"
                    defaultValue={invoiceData[prop]}
                    onChange={(e) => onFieldChange(e, prop)}
                  />
                </label>
              </div>
            ))}
            <h3>Items</h3>
            <table>
              <thead>
                <tr>
                  {detailProps.map((prop) => (
                    <th key={prop}>{lang[prop]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoiceData?.details.map((line, index) => (
                  <tr key={index}>
                    {detailProps.map((prop) => (
                      <td key={prop}>
                        <input
                          type="text"
                          defaultValue={line[prop]}
                          onChange={(e) => onDetailFieldChange(e, prop, index)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {totalProps.map((prop) => (
              <div key={prop}>
                <label>
                  {lang[prop]}:
                  <input
                    type="text"
                    defaultValue={invoiceData[prop]}
                    onChange={(e) => onFieldChange(e, prop)}
                  />
                </label>
              </div>
            ))}
          </form>
          <button onClick={onSubmit}>Submit</button>
        </>
      )}
    </>
  );
}

export default App;
