'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  mockBills,
  mockBillBreakdowns,
  mockStudents,
  getPaymentProofsByBill,
  mockPaymentHistory
} from '@/lib/mock-data';
import { 
  FiDollarSign, 
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiDownload,
  FiCalendar,
  FiInfo,
  FiCreditCard
} from 'react-icons/fi';
import { format } from 'date-fns';

export default function BillDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;
  const billId = params.billId as string;
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);

  // Get data
  const bill = mockBills.find(b => b.id === billId);
  const breakdown = mockBillBreakdowns[billId];
  const student = mockStudents.find(s => s.id === studentId);
  const paymentProofs = getPaymentProofsByBill(billId);
  const payments = mockPaymentHistory.filter(p => p.billId === billId);

  React.useEffect(() => {
    if (!bill || !student) {
      router.push('/tuition');
    }
  }, [bill, student, router]);

  if (!bill || !student) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: typeof bill.status) => {
    switch (status) {
      case 'paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'partial': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'overdue': return 'bg-red-50 text-red-700 border-red-200';
      case 'processing': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Bill Details" 
        showMenu={false}
        showBackButton={true}
        showNotification={false}
      />

      <div className="px-4 py-4">
        {/* Bill Header */}
        <Card className="mb-6">
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">{bill.description}</h2>
              <Badge 
                variant={
                  bill.status === 'paid' ? 'success' :
                  bill.status === 'overdue' ? 'error' :
                  bill.status === 'partial' ? 'default' :
                  'warning'
                }
              >
                {bill.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{student.name}</p>
            <p className="text-sm text-gray-500">{bill.schoolYear} • {bill.gradingPeriod}</p>
          </div>

          {/* Status Alert */}
          {bill.status === 'overdue' && (
            <div className={`rounded-lg p-3 border ${getStatusColor(bill.status)} mb-4`}>
              <div className="flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5" />
                <span className="font-semibold">This bill is overdue</span>
              </div>
              <p className="text-sm mt-1">Please settle immediately to avoid penalties.</p>
            </div>
          )}

          {/* Amount Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold">{formatCurrency(bill.amount)}</span>
              </div>
              {totalPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-semibold text-green-600">- {formatCurrency(totalPaid)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Balance Due</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(bill.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar className="w-4 h-4" />
            <span>Due Date: {format(bill.dueDate, 'MMMM d, yyyy')}</span>
          </div>
        </Card>

        {/* Fee Breakdown */}
        {breakdown && (
          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiFileText className="w-5 h-5 text-primary-500" />
              Fee Breakdown
            </h3>
            
            <div className="space-y-3">
              {breakdown.tuitionFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tuition Fee</span>
                  <span className="font-medium">{formatCurrency(breakdown.tuitionFee)}</span>
                </div>
              )}
              
              {breakdown.miscellaneousFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Miscellaneous Fee</span>
                  <span className="font-medium">{formatCurrency(breakdown.miscellaneousFee)}</span>
                </div>
              )}
              
              {breakdown.computerLaboratoryFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Computer Laboratory Fee</span>
                  <span className="font-medium">{formatCurrency(breakdown.computerLaboratoryFee)}</span>
                </div>
              )}
              
              {breakdown.learningManagementSystemFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">LMS Fee</span>
                  <span className="font-medium">{formatCurrency(breakdown.learningManagementSystemFee)}</span>
                </div>
              )}
              
              {breakdown.energyFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Energy Fee</span>
                  <span className="font-medium">{formatCurrency(breakdown.energyFee)}</span>
                </div>
              )}
              
              {breakdown.books && breakdown.books.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Books & Materials</p>
                  {breakdown.books.map((book, index) => (
                    <div key={index} className="flex justify-between text-sm pl-4 mb-1">
                      <span className="text-gray-600">{book.description}</span>
                      <span className="font-medium">{formatCurrency(book.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {breakdown.athleticsFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Athletics Fee</span>
                  <span className="font-medium">{formatCurrency(breakdown.athleticsFee)}</span>
                </div>
              )}
              
              {breakdown.idCardFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ID Card Fee</span>
                  <span className="font-medium">{formatCurrency(breakdown.idCardFee)}</span>
                </div>
              )}
              
              {breakdown.insuranceFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Insurance Fee</span>
                  <span className="font-medium">{formatCurrency(breakdown.insuranceFee)}</span>
                </div>
              )}
              
              {breakdown.ptaContribution && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PTA Contribution</span>
                  <span className="font-medium">{formatCurrency(breakdown.ptaContribution)}</span>
                </div>
              )}
              
              {breakdown.schoolSupplies && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">School Supplies</span>
                  <span className="font-medium">{formatCurrency(breakdown.schoolSupplies)}</span>
                </div>
              )}
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(breakdown.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5 text-primary-500" />
              Payment History
            </h3>
            
            <div className="space-y-3">
              {payments.map((payment) => {
                const proof = paymentProofs.find(p => p.id === payment.paymentProofId);
                return (
                  <div key={payment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(payment.paymentDate, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">Verified</Badge>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Method: {payment.method.replace('_', ' ')}</p>
                      <p>Ref: {payment.referenceNumber}</p>
                      {proof && <p>Tracking: {proof.trackingNumber}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Pending Payment Proofs */}
        {paymentProofs.filter(p => p.status === 'pending').length > 0 && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <FiClock className="w-5 h-5" />
              Pending Verification
            </h3>
            
            {paymentProofs.filter(p => p.status === 'pending').map((proof) => (
              <div key={proof.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(proof.amountPaid)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted {format(proof.submittedAt, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <Badge variant="warning" size="sm">Processing</Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Tracking: {proof.trackingNumber}
                </p>
              </div>
            ))}
            
            <p className="text-sm text-yellow-800 mt-3">
              Payment verification usually takes 2-3 business days.
            </p>
          </Card>
        )}

        {/* Payment Instructions */}
        <Card 
          className="mb-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowPaymentInstructions(!showPaymentInstructions)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiInfo className="w-5 h-5 text-primary-500" />
              <span className="font-medium text-gray-900">Payment Instructions</span>
            </div>
            <FiCalendar className={`w-5 h-5 text-gray-400 transform transition-transform ${
              showPaymentInstructions ? 'rotate-90' : ''
            }`} />
          </div>
          
          {showPaymentInstructions && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
              <p className="font-medium mb-2">Bank Accounts:</p>
              <ul className="space-y-2 mb-4">
                <li>• BDO: 001234567890 (Mater Dei Academy)</li>
                <li>• BPI: 9876543210 (Mater Dei Academy)</li>
                <li>• Metrobank: 123-456789-0 (Mater Dei Academy)</li>
              </ul>
              
              <p className="font-medium mb-2">Digital Wallets:</p>
              <ul className="space-y-2 mb-4">
                <li>• GCash: 09123456789 (MDA Finance)</li>
                <li>• Maya: 09987654321 (MDA Finance)</li>
              </ul>
              
              <p className="text-xs text-gray-500">
                Always use student number as reference: {student.name.split(' ')[0]}-2025
              </p>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        {bill.balance > 0 && (
          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={() => router.push(`/tuition/payment/upload?studentId=${studentId}&billId=${billId}`)}
              className="flex items-center justify-center gap-2"
            >
              <FiCreditCard className="w-5 h-5" />
              Upload Payment Proof
            </Button>
            
            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.push(`/tuition/${studentId}/bill/${billId}/download`)}
              className="flex items-center justify-center gap-2"
            >
              <FiDownload className="w-5 h-5" />
              Download Bill Statement
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}