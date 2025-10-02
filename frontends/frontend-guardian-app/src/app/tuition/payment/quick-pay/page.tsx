'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  getPendingBills,
  mockStudents
} from '@/lib/mock-data';
import { 
  FiDollarSign,
  FiCalendar,
  FiAlertCircle
} from 'react-icons/fi';
import { format } from 'date-fns';

export default function QuickPayPage() {
  const router = useRouter();
  const pendingBills = getPendingBills();
  
  // Group bills by student
  const billsByStudent = pendingBills.reduce((acc, bill) => {
    if (!acc[bill.studentId]) {
      acc[bill.studentId] = [];
    }
    acc[bill.studentId].push(bill);
    return acc;
  }, {} as Record<string, typeof pendingBills>);

  const totalAmount = pendingBills.reduce((sum, bill) => sum + bill.balance, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayAll = () => {
    const billIds = pendingBills.map(b => b.id).join(',');
    router.push(`/tuition/payment/upload?bills=${billIds}`);
  };

  const handlePayByStudent = (studentId: string) => {
    const studentBills = billsByStudent[studentId];
    const billIds = studentBills.map(b => b.id).join(',');
    router.push(`/tuition/payment/upload?studentId=${studentId}&bills=${billIds}`);
  };

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Pay All Pending Bills" 
        showMenu={false}
        showBackButton={true}
        showNotification={false}
      />

      <div className="px-4 py-4">
        {/* Summary Card */}
        <Card className="mb-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-1">Total Pending Amount</h2>
            <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm bg-white/20 rounded-lg p-3">
            <FiAlertCircle className="w-4 h-4" />
            <span>{pendingBills.length} pending bill{pendingBills.length > 1 ? 's' : ''} across {Object.keys(billsByStudent).length} student{Object.keys(billsByStudent).length > 1 ? 's' : ''}</span>
          </div>

          <Button 
            variant="secondary" 
            fullWidth 
            className="mt-4"
            onClick={handlePayAll}
          >
            Pay All Bills Now
          </Button>
        </Card>

        {/* Bills by Student */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Bills by Student
          </h3>
          
          <div className="space-y-4">
            {Object.entries(billsByStudent).map(([studentId, bills]) => {
              const student = mockStudents.find(s => s.id === studentId);
              const studentTotal = bills.reduce((sum, bill) => sum + bill.balance, 0);
              
              return (
                <Card key={studentId}>
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{student?.name}</h4>
                        <p className="text-sm text-gray-500">
                          {student?.grade} - {student?.section}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-600">
                          {formatCurrency(studentTotal)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {bills.length} bill{bills.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bill List */}
                  <div className="space-y-2 mb-4">
                    {bills.map((bill) => (
                      <div 
                        key={bill.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {bill.description}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <FiCalendar className="w-3 h-3" />
                            Due: {format(bill.dueDate, 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(bill.balance)}
                          </p>
                          <Badge 
                            variant={bill.status === 'overdue' ? 'error' : 'warning'} 
                            size="sm"
                          >
                            {bill.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => handlePayByStudent(studentId)}
                  >
                    Pay {student?.name.split(' ')[0]}'s Bills
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Options Info */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FiDollarSign className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Payment Options</h4>
              <p className="text-sm text-blue-800">
                You can pay all bills at once or pay by student. 
                Multiple payment methods are accepted including bank transfer, GCash, and Maya.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}