'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  mockStudents,
  getBillsByStudent,
  getPaymentHistoryByStudent,
  mockBillBreakdowns
} from '@/lib/mock-data';
import { 
  FiDollarSign, 
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiDownload,
  FiChevronRight,
  FiCalendar
} from 'react-icons/fi';
import { format } from 'date-fns';
import { Bill } from '@/types';

export default function StudentBillingPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');

  // Get student data
  const student = mockStudents.find(s => s.id === studentId);
  const bills = getBillsByStudent(studentId);
  const paymentHistory = getPaymentHistoryByStudent(studentId);

  React.useEffect(() => {
    if (!student) {
      router.push('/tuition');
    }
  }, [student, router]);

  if (!student) {
    return null;
  }

  // Calculate totals
  const totalBalance = bills.reduce((sum, bill) => sum + bill.balance, 0);
  const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Group bills by status
  const pendingBills = bills.filter(bill => bill.status === 'pending' || bill.status === 'partial');
  const paidBills = bills.filter(bill => bill.status === 'paid');
  const overdueBills = bills.filter(bill => bill.status === 'overdue');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBillIcon = (type: Bill['type']) => {
    switch (type) {
      case 'tuition': return '🎓';
      case 'miscellaneous': return '📋';
      case 'books': return '📚';
      case 'activities': return '🎯';
      default: return '📄';
    }
  };

  const getStatusColor = (status: Bill['status']) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'partial': return 'text-blue-600';
      case 'overdue': return 'text-red-600';
      case 'processing': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const handlePayAll = () => {
    const pendingBillIds = pendingBills.map(b => b.id).join(',');
    router.push(`/tuition/payment/upload?studentId=${studentId}&bills=${pendingBillIds}`);
  };

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title={student.name} 
        showMenu={false}
        showBackButton={true}
        showNotification={false}
      />

      <div className="px-4 py-4">
        {/* Student Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-300 rounded-full flex items-center justify-center">
              <span className="text-xl font-semibold text-white">
                {student.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{student.name}</h2>
              <p className="text-sm text-gray-600">{student.grade} - {student.section}</p>
              <p className="text-xs text-gray-500">School Year 2025-2026</p>
            </div>
          </div>
        </Card>

        {/* Balance Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="text-center">
            <p className="text-sm text-gray-500 mb-1">Current Balance</p>
            <p className={`text-2xl font-bold ${totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalBalance)}
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-gray-500 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </p>
          </Card>
        </div>

        {/* Quick Actions */}
        {totalBalance > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button
              variant="primary"
              onClick={handlePayAll}
              className="flex items-center justify-center gap-2"
            >
              <FiDollarSign className="w-4 h-4" />
              Pay All Bills
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push(`/tuition/${studentId}/statement`)}
              className="flex items-center justify-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              Download SOA
            </Button>
          </div>
        )}

        {/* Overdue Alert */}
        {overdueBills.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">
                  {overdueBills.length} Overdue Bill{overdueBills.length > 1 ? 's' : ''}
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  Total overdue: {formatCurrency(overdueBills.reduce((sum, bill) => sum + bill.balance, 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bills List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Bills</h3>
          
          {bills.length === 0 ? (
            <Card className="text-center py-8">
              <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">No outstanding bills</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <Card 
                  key={bill.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/tuition/${studentId}/bill/${bill.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getBillIcon(bill.type)}</div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{bill.description}</h4>
                          <p className="text-sm text-gray-500">{bill.billingPeriod}</p>
                        </div>
                        <Badge 
                          variant={
                            bill.status === 'paid' ? 'success' :
                            bill.status === 'overdue' ? 'error' :
                            bill.status === 'partial' ? 'default' :
                            'warning'
                          }
                          size="sm"
                        >
                          {bill.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">
                            Amount: {formatCurrency(bill.amount)}
                          </p>
                          {bill.balance < bill.amount && (
                            <p className="text-sm text-gray-500">
                              Paid: {formatCurrency(bill.amount - bill.balance)}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-semibold ${getStatusColor(bill.status)}`}>
                            {bill.balance > 0 ? formatCurrency(bill.balance) : 'PAID'}
                          </p>
                          {bill.status !== 'paid' && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                              <FiCalendar className="w-3 h-3" />
                              Due: {format(bill.dueDate, 'MMM d')}
                            </p>
                          )}
                        </div>
                      </div>

                      {bill.balance > 0 && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/tuition/payment/upload?studentId=${studentId}&billId=${bill.id}`);
                          }}
                        >
                          Upload Payment Proof
                        </Button>
                      )}
                    </div>
                    
                    <FiChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
            
            <div className="space-y-3">
              {paymentHistory.slice(0, 3).map((payment) => {
                const bill = bills.find(b => b.id === payment.billId);
                return (
                  <Card key={payment.id} className="bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {bill?.description || 'Payment'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(payment.paymentDate, 'MMM d, yyyy')} • {payment.referenceNumber}
                        </p>
                      </div>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {paymentHistory.length > 3 && (
              <Button
                variant="ghost"
                fullWidth
                className="mt-3"
                onClick={() => router.push(`/tuition/${studentId}/history`)}
              >
                View All Payment History
              </Button>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}