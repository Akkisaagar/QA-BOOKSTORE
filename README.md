📚 QA Bookstore API – Automated Testing Project

This project demonstrates API automation testing using Postman and Newman on a sample Bookstore backend built with Node.js and Express.
It is designed to validate functionality, security, and data integrity of REST APIs.

🔧 Tech Stack

Node.js

Express.js

Postman

Newman

GitHub

📌 APIs Covered
Module	Endpoint
Authentication	/auth
Books	/books
Orders	/orders
Reset Database	/reset
Audit Logs	/audit
✅ Test Coverage

The automation suite covers both positive and negative scenarios, including:

✔ Authentication validation

✔ Unauthorized access handling

✔ Request & response data validation

✔ Business logic checks (stock, orders, reset)

✔ Security checks (API key & token validation)

✔ Audit log & reset protection

🧪 How to Run the Tests

Run the automated API test suite using Newman:

newman run postman.json -r cli,html


This will:

Execute all Postman test cases

Show results in the terminal

Generate an HTML report

🎯 Project Purpose

This project is built to demonstrate real-world API testing skills, including:

Validating backend logic

Catching authorization & data bugs

Ensuring system reliability before production

It reflects how QA Engineers test APIs in professional environments.

📂 Project Structure
├── backend
│   ├── data.json
│   ├── node_modules
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
├── frontend
│   ├── app.js
│   ├── index.html
│   ├── node_modules
│   ├── package-lock.json
│   ├── package.json
│   └── style.css
├── postman.json
└── report.html

📊 Test Execution Report

Newman HTML report generated after running the test suite:

Open report.html in a browser to view detailed execution results.![report](https://github.com/user-attachments/assets/19f8b0cd-e18d-49a9-9f2c-0dd239c265da)

