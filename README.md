# Bank Statement Analyzer & Expense Tracker

## AI Engineering Master Prompt (Version 2.0)

---

# PROJECT OVERVIEW

You are upgrading an existing Android application built using React Native.

The current application converts PDF files into Excel files using RobotPDF APIs.

Current workflow:

```text
PDF
↓
Upload
↓
RobotPDF API
↓
Excel File
↓
Download
```

The application is already:

* Published on Google Play Store
* Has existing users
* Has an existing PDF upload flow
* Has an existing conversion workflow
* Uses RobotPDF APIs

Version 2.0 transforms the application into:

```text
PDF to Excel Converter
            +
Bank Statement Analyzer
            +
Expense Tracker
```

This is NOT a banking app.

This is NOT an account aggregator.

This is NOT an internet banking application.

The statement itself becomes the source of financial data.

---

# PRODUCT GOAL

Allow users to upload:

* PDF bank statements
* Excel statements
* CSV statements

and instantly:

* Extract transactions
* Analyze expenses
* Categorize spending
* Detect subscriptions
* Show charts and insights
* Track spending patterns

without:

* Bank login
* SMS permissions
* Account linking
* Open banking APIs
* Internet banking credentials

---

# EXISTING TECHNOLOGY STACK

## Mobile

* React Native CLI

## Backend

* Node.js
* Express.js

## Database

* Supabase PostgreSQL
* Prisma ORM

## Existing Services

* RobotPDF APIs

---

# EXISTING FEATURE

## PDF TO EXCEL

Current flow:

```text
PDF
↓
RobotPDF API
↓
Excel
↓
Download
```

This feature must remain unchanged.

---

# NEW FEATURE 1

## ANALYZE AFTER CONVERSION

After a PDF is converted successfully, the result screen must show:

* Download Excel
* Share File
* Analyze Statement

Flow:

```text
PDF
↓
RobotPDF
↓
Excel Generated
↓
Analyze Statement
↓
Expense Dashboard
```

The generated Excel file should automatically be parsed without requiring another upload.

---

# NEW FEATURE 2

## BANK STATEMENT ANALYZER

Home screen must include:

### Card 1

```text
PDF to Excel
```

Convert PDF files into Excel.

---

### Card 2

```text
Bank Statement Analyzer
```

Analyze bank statements and track expenses.

Supports:

* PDF
* XLS
* XLSX
* CSV

---

# HOME SCREEN

```text
--------------------------------
PDF to Excel
--------------------------------
Convert PDF files into Excel.

[ Open ]

--------------------------------
Bank Statement Analyzer
--------------------------------
Analyze your bank statements.

Supports:
✓ PDF
✓ Excel
✓ CSV

[ Analyze ]
```

---

# SUPPORTED FILES

* PDF
* XLS
* XLSX
* CSV

---

# FILE PROCESSING

## PDF

PDF statements are uploaded to RobotPDF.

RobotPDF extracts transaction tables.

---

## Excel

Parse locally using XLSX library.

---

## CSV

Parse locally.

---

# PROCESSING PIPELINE

```text
PDF / XLS / CSV
        ↓
Transaction Extraction
        ↓
Standard Transaction Model
        ↓
Merchant Cleanup
        ↓
Category Engine
        ↓
Analysis Engine
        ↓
Charts & Dashboard
```

---

# UNIVERSAL TRANSACTION MODEL

```json
{
  "date": "2026-06-01",
  "description": "UPI/ZOMATO",
  "amount": 342,
  "type": "DEBIT",
  "balance": 15432
}
```

Optional:

```json
{
  "merchant": "Zomato",
  "category": "Food",
  "isRecurring": false
}
```

---

# TRANSACTION EXTRACTION

Extract:

* Date
* Description
* Debit
* Credit
* Amount
* Balance

The parser must support:

* Separate Debit/Credit columns
* Single Amount columns
* Different date formats

---

# MERCHANT CLEANUP

Examples:

```text
UPI/ZOMATO
↓
Zomato
```

```text
GOOGLE*YOUTUBE
↓
YouTube Premium
```

```text
AMZN
↓
Amazon
```

```text
UBER TRIP
↓
Uber
```

Merchant recognition should use:

* Dictionary matching
* Keyword matching
* Alias database

---

# EXPENSE CATEGORIES

Default categories:

* Food
* Shopping
* Travel
* Transportation
* Bills
* Entertainment
* Healthcare
* Education
* Investments
* Income
* Transfers
* Subscription
* Others

Users may edit categories later.

---

# ANALYSIS ENGINE

Calculate:

## Total Income

Sum of credits.

---

## Total Expenses

Sum of debits.

---

## Savings

Income minus expenses.

---

## Category Spending

Total spending by category.

---

## Top Merchants

Most used merchants.

---

## Monthly Spending

Spending trends.

---

# SUBSCRIPTION DETECTION

Detect recurring payments.

Examples:

* Netflix
* Spotify
* ChatGPT
* YouTube Premium
* Insurance
* EMI
* SIP

Rules:

* Same merchant
* Similar amount
* Regular intervals

---

# DASHBOARD SCREENS

---

## SCREEN 1 — OVERVIEW

Cards:

* Total Income
* Total Expenses
* Net Savings

Charts:

* Income vs Expenses

---

## SCREEN 2 — CATEGORY ANALYSIS

Pie chart.

Examples:

* Food
* Shopping
* Bills

---

## SCREEN 3 — SPENDING TRENDS

Line chart.

Monthly spending.

---

## SCREEN 4 — MERCHANTS

Top spending merchants.

---

## SCREEN 5 — TRANSACTIONS

Searchable transaction list.

Filters:

* Category
* Date
* Amount

---

# CHARTS

Use:

* Pie Chart
* Bar Chart
* Line Chart

Libraries:

* react-native-gifted-charts

---

# RECOMMENDED LIBRARIES

## File Picker

* react-native-document-picker

## Excel Parsing

* xlsx

## CSV Parsing

* papaparse

## Charts

* react-native-gifted-charts

## Date Handling

* dayjs

---

# EXPORT FEATURES

Users can export:

* Excel
* CSV

Future versions may support:

* PDF reports
* Accounting exports

---

# DATA STORAGE

Save:

* Uploaded statements
* Parsed transactions
* Categories
* Analysis results

Use:

* Supabase
* Prisma

---

# PRIVACY

The application must emphasize:

✓ No bank login

✓ No account linking

✓ No SMS access

✓ No financial credentials

✓ User-controlled uploads

---

# FEATURES INCLUDED IN VERSION 2.0

✓ PDF Analysis

✓ Excel Analysis

✓ CSV Analysis

✓ Expense Tracking

✓ Categories

✓ Charts

✓ Dashboard

✓ Merchant Analysis

✓ Subscription Detection

✓ Transaction Search

✓ Analyze Converted PDFs

---

# FEATURES OUT OF SCOPE

❌ OCR

❌ Internet Banking

❌ Account Aggregators

❌ SMS Parsing

❌ Open Banking APIs

❌ Investment Tracking

❌ Budget Planning

❌ Tax Filing

❌ QuickBooks Integration

❌ Xero Integration

---

# MONETIZATION

## Free Version

* One statement
* Limited transactions
* Basic charts

---

## Premium

* Unlimited statements
* Unlimited transactions
* Subscription detection
* Advanced insights
* Multi-statement analysis

---

# PRODUCT POSITIONING

```text
Bank Statement Analyzer & Expense Tracker
```

Tagline:

```text
Upload your bank statement and instantly understand your spending.
```

---

# MARKETING MESSAGE

Analyze PDF, Excel, and CSV bank statements in seconds.

✓ No bank login

✓ No SMS access

✓ No account linking

✓ Privacy-first

Track expenses, subscriptions, income, and spending patterns with beautiful charts and insights.

Powered by RobotPDF.
