/**
 * End-to-End Workflow Test
 * Tests the complete subscription-to-payment lifecycle with isolated test data.
 * All steps execute within a single end-to-end test so state transitions and documents
 * persist seamlessly throughout the lifecycle.
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Subscription = require('../../src/models/Subscription');

describe('End-to-End: Full Subscription-to-Payment Workflow', () => {
  test('Complete subscription-to-payment lifecycle', async () => {
    // Step 1: Login as admin
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@E2E123', salt);
    await User.create({ name: 'E2E Admin', email: 'e2e-admin@test.io', passwordHash, role: 'admin' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'e2e-admin@test.io', password: 'Admin@E2E123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toHaveProperty('token');
    const token = loginRes.body.data.token;

    // Step 2: Create customer
    const custRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Corp', email: 'e2e@corp.io', phone: '+91 9000000000', company: 'E2E Corp Ltd' });

    expect(custRes.status).toBe(201);
    expect(custRes.body.data.customer.email).toBe('e2e@corp.io');
    const customerId = custRes.body.data.customer._id;

    // Step 3: Create product
    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E ERP Suite', type: 'software', salesPrice: 150000, isActive: true });

    expect(prodRes.status).toBe(201);
    expect(prodRes.body.data.product.salesPrice).toBe(150000);
    const productId = prodRes.body.data.product._id;

    // Step 4: Create subscription plan
    const planRes = await request(app)
      .post('/api/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Monthly Plan', productId, billingInterval: 'monthly', price: 150000, minimumQuantity: 1 });

    expect(planRes.status).toBe(201);
    expect(planRes.body.data.plan.billingInterval).toBe('monthly');
    const planId = planRes.body.data.plan._id;

    // Step 5: Create subscription (draft)
    const startDate = '2026-09-01T00:00:00.000Z';
    const subRes = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId, planId, quantity: 2, startDate });

    expect(subRes.status).toBe(201);
    expect(subRes.body.data.subscription.status).toBe('draft');
    expect(subRes.body.data.subscription.unitPriceSnapshot).toBe(150000);
    expect(subRes.body.data.subscription.billingIntervalSnapshot).toBe('monthly');
    const subscriptionId = subRes.body.data.subscription._id;

    // Step 6: Activate subscription (draft -> active)
    const actRes = await request(app)
      .patch(`/api/subscriptions/${subscriptionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active' });

    expect(actRes.status).toBe(200);
    expect(actRes.body.data.subscription.status).toBe('active');

    // Step 7: Set nextBillingDate to past to make subscription due
    await Subscription.findByIdAndUpdate(subscriptionId, {
      nextBillingDate: new Date('2026-10-01T00:00:00.000Z')
    });
    const sub = await Subscription.findById(subscriptionId);
    expect(new Date(sub.nextBillingDate).getTime()).toBeLessThan(Date.now());

    // Step 8: Run billing — generates invoice for due subscription
    const billRes = await request(app)
      .post('/api/billing/run')
      .set('Authorization', `Bearer ${token}`);

    expect(billRes.status).toBe(200);
    expect(billRes.body.data.createdCount).toBe(1);
    expect(billRes.body.data.invoices[0].status).toBe('created');
    expect(billRes.body.data.invoices[0].totalAmount).toBe(354000); // 300000 subtotal + 54000 tax

    // Step 9: Retrieve the generated invoice
    const invListRes = await request(app)
      .get('/api/invoices')
      .set('Authorization', `Bearer ${token}`);

    expect(invListRes.status).toBe(200);
    expect(invListRes.body.data.total).toBe(1);
    const invoice = invListRes.body.data.invoices[0];
    expect(invoice.status).toBe('confirmed');
    expect(invoice.totalAmount).toBe(354000);
    expect(invoice.outstandingAmount).toBe(354000);
    expect(invoice.paidAmount).toBe(0);
    const invoiceId = invoice._id;

    // Step 10: Record full payment against the invoice
    const payRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceId, paymentMethod: 'bank_transfer', transactionReference: 'TXN-E2E-001' });

    expect(payRes.status).toBe(201);
    expect(payRes.body.data.payment.amount).toBe(354000); // derived full outstanding amount
    expect(payRes.body.data.invoice.status).toBe('paid');
    expect(payRes.body.data.invoice.outstandingAmount).toBe(0);
    const paymentId = payRes.body.data.payment._id;

    // Step 11: Verify payment record and invoice final state
    const payGetRes = await request(app)
      .get(`/api/payments/${paymentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(payGetRes.status).toBe(200);
    expect(payGetRes.body.data.payment.amount).toBe(354000);
    expect(payGetRes.body.data.payment.paymentMethod).toBe('bank_transfer');

    const invGetRes = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(invGetRes.status).toBe(200);
    expect(invGetRes.body.data.invoice.status).toBe('paid');
    expect(invGetRes.body.data.invoice.outstandingAmount).toBe(0);
    expect(invGetRes.body.data.invoice.paidAmount).toBe(354000);

    // Step 12: Verify dashboard metrics reflect the completed workflow
    const dashRes = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.activeSubscriptions).toBe(1);
    expect(dashRes.body.data.totalCollectedRevenue).toBe(354000);
    expect(dashRes.body.data.totalOutstandingAmount).toBe(0);
    expect(dashRes.body.data.overdueInvoices).toBe(0);

    // Step 13: Verify billing run does NOT generate duplicate invoice
    const billRepeatRes = await request(app)
      .post('/api/billing/run')
      .set('Authorization', `Bearer ${token}`);

    expect(billRepeatRes.status).toBe(200);
    expect(billRepeatRes.body.data.createdCount).toBe(0);

    const invRepeatRes = await request(app)
      .get(`/api/invoices?subscriptionId=${subscriptionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(invRepeatRes.body.data.total).toBe(1);
  });
});
