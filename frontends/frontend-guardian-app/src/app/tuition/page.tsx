'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  mockStudents,
  getBillsByStudent,
  getTotalBalance,
  getPendingBills,
  getOverdueBills
} from '@/lib/mock-data';
import { 
  FiDollarSign, 
  FiAlertCircle, 
  FiCheckCircle,
  FiClock,
  FiChevronRight,
  FiCalendar
} from 'react-icons/fi';
import { format } from 'date-fns';

export default function TuitionPage() {
  const router = useRouter();

  // Calculate family totals
  const totalFamilyBalance = getTotalBalance();
  const pendingBills = getPendingBills();
  const overdueBills = getOverdueBills();
  
  // Find next due date
  const nextDueDate = pendingBills
    .map(bill => bill.dueDate)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (balance: number, hasOverdue: boolean) => {
    if (hasOverdue) return 'text-red-600';
    if (balance > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = (balance: number, hasOverdue: boolean) => {
    if (hasOverdue) return { variant: 'error' as const, text: 'Overdue' };
    if (balance > 0) return { variant: 'warning' as const, text: 'Pending' };
    return { variant: 'success' as const, text: 'Paid' };
  };

  return (
    <AuthenticatedLayout
      title="Tuition & Fees"
      className="bg-gray-50"
    >
      <div className="px-4 py-4">
        {/* Family Summary Card */}
        <Card className="mb-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-1">Total Family Balance</h2>
            <p className="text-3xl font-bold">{formatCurrency(totalFamilyBalance)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FiClock className="w-4 h-4" />
                <span className="text-sm">Pending Bills</span>
              </div>
              <p className="text-xl font-semibold">{pendingBills.length}</p>
            </div>
            
            <div className="bg-white/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FiAlertCircle className="w-4 h-4" />
                <span className="text-sm">Overdue</span>
              </div>
              <p className="text-xl font-semibold">{overdueBills.length}</p>
            </div>
          </div>

          {nextDueDate && (
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg p-2">
              <FiCalendar className="w-4 h-4" />
              <span>Next payment due: {format(nextDueDate, 'MMM d, yyyy')}</span>
            </div>
          )}

          {totalFamilyBalance > 0 && (
            <Button 
              variant="secondary" 
              fullWidth 
              className="mt-4"
              onClick={() => router.push('/tuition/payment/quick-pay')}
            >
              Pay All Pending Bills
            </Button>
          )}
        </Card>

        {/* Quick Actions */}
        {overdueBills.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">
                  Overdue Payment Alert
                </h3>
                <p className="text-sm text-red-800">
                  You have {overdueBills.length} overdue bill{overdueBills.length > 1 ? 's' : ''}. 
                  Please settle immediately to avoid penalties.
                </p>
                <Button 
                  size="sm" 
                  variant="primary"
                  className="mt-2 !bg-red-600 hover:!bg-red-700"
                  onClick={() => router.push('/tuition/overdue')}
                >
                  View Overdue Bills
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Student Payment Cards */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Student Billing Summary
          </h3>
          
          <div className="space-y-4">
            {mockStudents.map((student) => {
              const studentBills = getBillsByStudent(student.id);
              const studentBalance = studentBills.reduce((sum, bill) => sum + bill.balance, 0);
              const hasOverdue = studentBills.some(bill => bill.status === 'overdue');
              const pendingCount = studentBills.filter(bill => 
                bill.status === 'pending' || bill.status === 'partial'
              ).length;
              
              const statusBadge = getStatusBadge(studentBalance, hasOverdue);

              return (
                <Card 
                  key={student.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/tuition/${student.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Student Photo */}
                    <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-gray-600">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-500">
                            {student.grade} - {student.section}
                          </p>
                        </div>
                        <Badge variant={statusBadge.variant} size="sm">
                          {statusBadge.text}
                        </Badge>
                      </div>

                      {/* Balance Info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Current Balance</p>
                          <p className={`text-xl font-semibold ${getStatusColor(studentBalance, hasOverdue)}`}>
                            {formatCurrency(studentBalance)}
                          </p>
                        </div>
                        
                        {pendingCount > 0 && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{pendingCount} pending bill{pendingCount > 1 ? 's' : ''}</p>
                            <FiChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                          </div>
                        )}
                      </div>

                      {/* Quick Pay Button */}
                      {studentBalance > 0 && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/tuition/payment/upload?studentId=${student.id}`);
                          }}
                        >
                          Upload Payment Proof
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment History Link */}
        <Card 
          className="mt-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/tuition/history')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Payment History</h4>
                <p className="text-sm text-gray-500">View all past payments</p>
              </div>
            </div>
            <FiChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help with payments?
          </p>
          <button 
            onClick={() => router.push('/account/help')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-1"
          >
            Contact Finance Office
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}