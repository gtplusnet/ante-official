'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  getOverdueBills,
  mockStudents
} from '@/lib/mock-data';
import { 
  FiAlertTriangle,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import { format, differenceInDays } from 'date-fns';

export default function OverdueBillsPage() {
  const router = useRouter();
  const overdueBills = getOverdueBills();
  
  // Group bills by student
  const billsByStudent = overdueBills.reduce((acc, bill) => {
    if (!acc[bill.studentId]) {
      acc[bill.studentId] = [];
    }
    acc[bill.studentId].push(bill);
    return acc;
  }, {} as Record<string, typeof overdueBills>);

  const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.balance, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysOverdue = (dueDate: Date) => {
    return differenceInDays(new Date(), dueDate);
  };

  const handlePayAll = () => {
    const billIds = overdueBills.map(b => b.id).join(',');
    router.push(`/tuition/payment/upload?bills=${billIds}`);
  };

  const handlePayBill = (billId: string, studentId: string) => {
    router.push(`/tuition/payment/upload?studentId=${studentId}&billId=${billId}`);
  };

  if (overdueBills.length === 0) {
    return (
      <MobileLayout className="bg-gray-50">
        <Header 
          title="Overdue Bills" 
          showMenu={false}
          showBackButton={true}
          showNotification={false}
        />
        
        <div className="px-4 py-4">
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiClock className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Overdue Bills
            </h3>
            <p className="text-gray-600 mb-6">
              Great! All your bills are up to date.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/tuition')}
            >
              Back to Tuition Dashboard
            </Button>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Overdue Bills" 
        showMenu={false}
        showBackButton={true}
        showNotification={false}
      />

      <div className="px-4 py-4">
        {/* Alert Card */}
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-1">
                Immediate Action Required
              </h2>
              <p className="text-sm text-red-800 mb-3">
                You have {overdueBills.length} overdue bill{overdueBills.length > 1 ? 's' : ''} totaling {formatCurrency(totalOverdue)}. 
                Please settle immediately to avoid penalties and service interruption.
              </p>
              <Button 
                variant="primary"
                size="sm"
                className="!bg-red-600 hover:!bg-red-700"
                onClick={handlePayAll}
              >
                Pay All Overdue Bills Now
              </Button>
            </div>
          </div>
        </Card>

        {/* Overdue Bills by Student */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Overdue Bills Details
          </h3>
          
          <div className="space-y-4">
            {Object.entries(billsByStudent).map(([studentId, bills]) => {
              const student = mockStudents.find(s => s.id === studentId);
              const studentTotal = bills.reduce((sum, bill) => sum + bill.balance, 0);
              
              return (
                <Card key={studentId} className="border-red-200">
                  <div className="mb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{student?.name}</h4>
                        <p className="text-sm text-gray-500">
                          {student?.grade} - {student?.section}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          {formatCurrency(studentTotal)}
                        </p>
                        <Badge variant="error" size="sm">
                          {bills.length} Overdue
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Overdue Bill List */}
                  <div className="space-y-3">
                    {bills.map((bill) => {
                      const daysOverdue = getDaysOverdue(bill.dueDate);
                      
                      return (
                        <div 
                          key={bill.id}
                          className="bg-red-50 rounded-lg p-3 border border-red-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">
                                {bill.description}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {bill.billingPeriod}
                              </p>
                            </div>
                            <p className="font-bold text-red-600">
                              {formatCurrency(bill.balance)}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-red-700">
                              <FiCalendar className="w-4 h-4" />
                              <span>Due: {format(bill.dueDate, 'MMM d, yyyy')}</span>
                            </div>
                            <span className="font-semibold text-red-800">
                              {daysOverdue} days overdue
                            </span>
                          </div>

                          <Button
                            size="sm"
                            variant="primary"
                            fullWidth
                            className="mt-3 !bg-red-600 hover:!bg-red-700"
                            onClick={() => handlePayBill(bill.id, studentId)}
                          >
                            Pay This Bill
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Penalty Warning */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">
                Late Payment Penalties
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 2% monthly interest on overdue amounts</li>
                <li>• Possible suspension of student privileges</li>
                <li>• Hold on academic records and report cards</li>
                <li>• May affect enrollment for next school year</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Contact Info */}
        <Card className="mt-4">
          <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
          <p className="text-sm text-gray-600 mb-3">
            If you're experiencing financial difficulties, please contact the Finance Office immediately.
          </p>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <FiPhone className="w-4 h-4 text-gray-400" />
              <span>(02) 8123-4567</span>
            </p>
            <p className="flex items-center gap-2">
              <FiMail className="w-4 h-4 text-gray-400" />
              <span>finance@materdeiacademy.edu</span>
            </p>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}