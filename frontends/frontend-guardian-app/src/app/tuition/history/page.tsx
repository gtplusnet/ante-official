'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { mockStudents, mockBills } from '@/lib/mock-data';
import { 
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiFilter,
  FiDownload,
  FiEye,
  FiClock,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import { format, subMonths, isWithinInterval } from 'date-fns';

// Mock payment history data
interface PaymentRecord {
  id: string;
  trackingNumber: string;
  paymentDate: Date;
  verificationDate: Date | null;
  amount: number;
  status: 'verified' | 'pending' | 'rejected';
  paymentMethod: string;
  referenceNumber: string;
  billIds: string[];
  studentIds: string[];
  notes?: string;
  rejectionReason?: string;
  receiptUrl?: string;
}

const mockPaymentHistory: PaymentRecord[] = [
  {
    id: '1',
    trackingNumber: 'PAY-20241210-001',
    paymentDate: new Date('2024-12-10'),
    verificationDate: new Date('2024-12-12'),
    amount: 15000,
    status: 'verified',
    paymentMethod: 'Bank Deposit',
    referenceNumber: 'BDO-123456789',
    billIds: ['1'],
    studentIds: ['1'],
    receiptUrl: '/receipts/PAY-20241210-001.pdf'
  },
  {
    id: '2',
    trackingNumber: 'PAY-20241125-002',
    paymentDate: new Date('2024-11-25'),
    verificationDate: new Date('2024-11-27'),
    amount: 12000,
    status: 'verified',
    paymentMethod: 'GCash',
    referenceNumber: 'GC-987654321',
    billIds: ['2'],
    studentIds: ['1'],
    receiptUrl: '/receipts/PAY-20241125-002.pdf'
  },
  {
    id: '3',
    trackingNumber: 'PAY-20241215-003',
    paymentDate: new Date('2024-12-15'),
    verificationDate: null,
    amount: 8000,
    status: 'pending',
    paymentMethod: 'Maya',
    referenceNumber: 'MY-456789123',
    billIds: ['3'],
    studentIds: ['2'],
    notes: 'Currently being processed'
  },
  {
    id: '4',
    trackingNumber: 'PAY-20241020-004',
    paymentDate: new Date('2024-10-20'),
    verificationDate: new Date('2024-10-22'),
    amount: 10000,
    status: 'verified',
    paymentMethod: 'Online Banking',
    referenceNumber: 'OB-321654987',
    billIds: ['4'],
    studentIds: ['2'],
    receiptUrl: '/receipts/PAY-20241020-004.pdf'
  },
  {
    id: '5',
    trackingNumber: 'PAY-20241205-005',
    paymentDate: new Date('2024-12-05'),
    verificationDate: new Date('2024-12-06'),
    amount: 5000,
    status: 'rejected',
    paymentMethod: 'Check',
    referenceNumber: 'CHK-789456123',
    billIds: ['5'],
    studentIds: ['1'],
    rejectionReason: 'Invalid reference number. Please resubmit with correct details.'
  }
];

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, 1month, 3months, 6months
  const [statusFilter, setStatusFilter] = useState('all'); // all, verified, pending, rejected
  const [showFilters, setShowFilters] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter payments
  const filteredPayments = React.useMemo(() => {
    let filtered = [...mockPaymentHistory];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const months = parseInt(dateFilter);
      const startDate = subMonths(new Date(), months);
      filtered = filtered.filter(payment => 
        isWithinInterval(payment.paymentDate, { start: startDate, end: new Date() })
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  }, [searchTerm, dateFilter, statusFilter]);

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success" size="sm">Verified</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'rejected':
        return <Badge variant="error" size="sm">Rejected</Badge>;
    }
  };

  const handleViewReceipt = (payment: PaymentRecord) => {
    // In a real app, this would open the receipt PDF or show a modal
    alert(`Viewing receipt for ${payment.trackingNumber}`);
  };

  const handleResubmit = (payment: PaymentRecord) => {
    const billIds = payment.billIds.join(',');
    router.push(`/tuition/payment/upload?bills=${billIds}&retry=true`);
  };

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const verified = filteredPayments.filter(p => p.status === 'verified');
    const pending = filteredPayments.filter(p => p.status === 'pending');
    const rejected = filteredPayments.filter(p => p.status === 'rejected');

    return {
      total,
      verifiedAmount: verified.reduce((sum, p) => sum + p.amount, 0),
      verifiedCount: verified.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length
    };
  }, [filteredPayments]);

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Payment History" 
        showMenu={false}
        showBackButton={true}
        showNotification={false}
      />

      <div className="px-4 py-4">
        {/* Search and Filter */}
        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by tracking or reference number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>
            <Button
              size="sm"
              variant={showFilters ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(!showFilters)}
              className="!px-3"
            >
              <FiFilter className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <Card className="mb-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Time</option>
                    <option value="1">Last Month</option>
                    <option value="3">Last 3 Months</option>
                    <option value="6">Last 6 Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="bg-green-50 border-green-200">
            <div className="text-center">
              <p className="text-xs text-green-600 mb-1">Verified Payments</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(summaryStats.verifiedAmount)}
              </p>
              <p className="text-xs text-green-600">
                {summaryStats.verifiedCount} payment{summaryStats.verifiedCount !== 1 ? 's' : ''}
              </p>
            </div>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
              <p className="text-xs text-blue-600 mb-1">Total Payments</p>
              <p className="text-lg font-bold text-blue-700">
                {formatCurrency(summaryStats.total)}
              </p>
              <p className="text-xs text-blue-600">
                {filteredPayments.length} record{filteredPayments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </Card>
        </div>

        {/* Status Counts */}
        {(summaryStats.pendingCount > 0 || summaryStats.rejectedCount > 0) && (
          <div className="flex gap-2 mb-4">
            {summaryStats.pendingCount > 0 && (
              <Badge variant="warning" size="sm">
                {summaryStats.pendingCount} Pending
              </Badge>
            )}
            {summaryStats.rejectedCount > 0 && (
              <Badge variant="error" size="sm">
                {summaryStats.rejectedCount} Rejected
              </Badge>
            )}
          </div>
        )}

        {/* Payment List */}
        <div className="space-y-3">
          {filteredPayments.length === 0 ? (
            <Card className="text-center py-8">
              <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No payment records found</p>
            </Card>
          ) : (
            filteredPayments.map((payment) => {
              const bills = payment.billIds.map(id => mockBills.find(b => b.id === id)).filter(Boolean);
              const students = payment.studentIds.map(id => mockStudents.find(s => s.id === id)).filter(Boolean);
              
              return (
                <Card key={payment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{payment.trackingNumber}</h4>
                        <p className="text-sm text-gray-500">
                          {format(payment.paymentDate, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-600 mb-1">
                          {formatCurrency(payment.amount)}
                        </p>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Payment Method</span>
                        <span className="font-medium">{payment.paymentMethod}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Reference</span>
                        <span className="font-medium font-mono text-xs">{payment.referenceNumber}</span>
                      </div>

                      {students.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Student{students.length > 1 ? 's' : ''}</span>
                          <span className="font-medium">
                            {students.map(s => s?.name.split(' ')[0]).join(', ')}
                          </span>
                        </div>
                      )}

                      {payment.verificationDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Verified on</span>
                          <span className="font-medium">
                            {format(payment.verificationDate, 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status-specific content */}
                    {payment.status === 'pending' && payment.notes && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <FiClock className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-yellow-800">{payment.notes}</p>
                        </div>
                      </div>
                    )}

                    {payment.status === 'rejected' && payment.rejectionReason && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <FiX className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800">{payment.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {/* Bills */}
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-700 mb-2">Bills Paid:</p>
                      <div className="space-y-1">
                        {bills.map((bill) => bill && (
                          <div key={bill.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{bill.description}</span>
                            <span className="font-medium">{formatCurrency(bill.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3">
                      {payment.status === 'verified' && payment.receiptUrl && (
                        <Button
                          size="sm"
                          variant="secondary"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReceipt(payment);
                          }}
                        >
                          <FiDownload className="w-4 h-4 mr-1" />
                          Download Receipt
                        </Button>
                      )}
                      
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReceipt(payment);
                          }}
                        >
                          <FiEye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      )}
                      
                      {payment.status === 'rejected' && (
                        <Button
                          size="sm"
                          variant="primary"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResubmit(payment);
                          }}
                        >
                          <FiAlertCircle className="w-4 h-4 mr-1" />
                          Resubmit Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Help Section */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Payment Verification</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Payments are usually verified within 2-3 business days</li>
                <li>• You'll receive SMS/email once payment is verified</li>
                <li>• Keep your reference numbers for future reference</li>
                <li>• Contact finance office for urgent concerns</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}