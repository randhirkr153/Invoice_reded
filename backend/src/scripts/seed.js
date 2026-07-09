const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

const seedData = async () => {
  try {
    // Connect to database
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/invoice-db');
    console.log('Connected. Dropping collections...');

    // Clear old data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    console.log('Collections cleared.');

    // 1. Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91-9988776655',
      companyName: 'Acme Enterprises Ltd',
      gstNumber: '27AAACA1234A1Z1',
      address: {
        street: '123 Main Business Blvd',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        country: 'India'
      }
    });
    console.log('Admin account created: admin@example.com / Admin@123');

    // 2. Create Clients
    const client1 = await User.create({
      name: 'John Doe',
      email: 'client@example.com',
      password: 'Client@123',
      role: 'client',
      phone: '+91-8877665544',
      companyName: 'Innovate Tech Solutions',
      gstNumber: '27AAACA5678A1Z2',
      address: {
        street: '456 Corporate Tech Park',
        city: 'Pune',
        state: 'Maharashtra',
        zip: '411001',
        country: 'India'
      }
    });

    const client2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'Client@123',
      role: 'client',
      phone: '+1-555-0199',
      companyName: 'Globex Software Inc',
      gstNumber: '99USACA9876A1Z3',
      address: {
        street: '789 Broadway Ave',
        city: 'New York',
        state: 'NY',
        zip: '10003',
        country: 'USA'
      }
    });
    console.log('Client accounts created:');
    console.log('- client@example.com / Client@123');
    console.log('- jane@example.com / Client@123');

    // 3. Create Products
    const p1 = await Product.create({
      name: 'Enterprise Cloud Subscription',
      sku: 'CLD-ENT-M',
      price: 150.00,
      taxRate: 18,
      description: 'Monthly license for Acme Cloud platform'
    });

    const p2 = await Product.create({
      name: 'Custom Integration Consulting',
      sku: 'CNS-INT-H',
      price: 75.00,
      taxRate: 18,
      description: 'Consultancy fee per engineering hour'
    });

    const p3 = await Product.create({
      name: 'Rest API Developer Pack',
      sku: 'DEV-API-S',
      price: 299.99,
      taxRate: 18,
      description: 'Access to custom endpoints and webhooks integration'
    });
    console.log('Products catalog seeded.');

    // 4. Create Invoices
    const now = new Date();
    
    // Paid Invoice
    const paidInvoice = await Invoice.create({
      client: client1._id,
      items: [
        {
          product: p1._id,
          name: p1.name,
          price: p1.price,
          quantity: 2,
          taxRate: p1.taxRate,
          taxAmount: p1.price * 2 * (p1.taxRate / 100),
          total: (p1.price * 2) + (p1.price * 2 * (p1.taxRate / 100))
        }
      ],
      subtotal: p1.price * 2,
      discountRate: 5,
      discountAmount: (p1.price * 2) * 0.05,
      taxTotal: p1.price * 2 * (p1.taxRate / 100),
      totalAmount: ((p1.price * 2) * 0.95) + (p1.price * 2 * (p1.taxRate / 100)),
      status: 'paid',
      dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days in future
      notes: 'Thank you for your business!',
      terms: 'Payment is due within 15 days.',
      companyDetails: {
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        companyName: admin.companyName,
        gstNumber: admin.gstNumber,
        address: admin.address
      },
      clientDetails: {
        name: client1.name,
        email: client1.email,
        phone: client1.phone,
        companyName: client1.companyName,
        gstNumber: client1.gstNumber,
        address: client1.address
      }
    });

    // Unpaid Invoice
    const unpaidInvoice = await Invoice.create({
      client: client1._id,
      items: [
        {
          product: p3._id,
          name: p3.name,
          price: p3.price,
          quantity: 1,
          taxRate: p3.taxRate,
          taxAmount: p3.price * 1 * (p3.taxRate / 100),
          total: p3.price + (p3.price * (p3.taxRate / 100))
        }
      ],
      subtotal: p3.price,
      discountRate: 0,
      discountAmount: 0,
      taxTotal: p3.price * (p3.taxRate / 100),
      totalAmount: p3.price + (p3.price * (p3.taxRate / 100)),
      status: 'unpaid',
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
      notes: 'Net-30 term agreement.',
      terms: 'Standard SaaS terms apply.',
      companyDetails: {
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        companyName: admin.companyName,
        gstNumber: admin.gstNumber,
        address: admin.address
      },
      clientDetails: {
        name: client1.name,
        email: client1.email,
        phone: client1.phone,
        companyName: client1.companyName,
        gstNumber: client1.gstNumber,
        address: client1.address
      }
    });

    // Overdue Invoice
    await Invoice.create({
      client: client2._id,
      items: [
        {
          product: p2._id,
          name: p2.name,
          price: p2.price,
          quantity: 10, // 10 consulting hours
          taxRate: p2.taxRate,
          taxAmount: p2.price * 10 * (p2.taxRate / 100),
          total: (p2.price * 10) + (p2.price * 10 * (p2.taxRate / 100))
        }
      ],
      subtotal: p2.price * 10,
      discountRate: 10,
      discountAmount: (p2.price * 10) * 0.10,
      taxTotal: p2.price * 10 * (p2.taxRate / 100),
      totalAmount: ((p2.price * 10) * 0.90) + (p2.price * 10 * (p2.taxRate / 100)),
      status: 'overdue',
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days in past!
      notes: 'Consulting deliverables signed off.',
      terms: 'Interest charged for late payments.',
      companyDetails: {
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        companyName: admin.companyName,
        gstNumber: admin.gstNumber,
        address: admin.address
      },
      clientDetails: {
        name: client2.name,
        email: client2.email,
        phone: client2.phone,
        companyName: client2.companyName,
        gstNumber: client2.gstNumber,
        address: client2.address
      }
    });
    console.log('Invoices seeded (1 Paid, 1 Unpaid, 1 Overdue).');

    // 5. Create Payment record for paid invoice
    await Payment.create({
      invoice: paidInvoice._id,
      client: client1._id,
      amount: paidInvoice.totalAmount,
      paymentMethod: 'bank_transfer',
      transactionReference: 'TXN-SEED-991188',
      status: 'completed',
      paymentDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // yesterday
    });
    console.log('Payment records seeded.');
    
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
