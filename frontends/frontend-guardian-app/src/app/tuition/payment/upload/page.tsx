'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PaymentMethodSelector } from '@/components/features/PaymentMethodSelector';
import { FileUploadZone } from '@/components/features/FileUploadZone';
import { 
  mockBills,
  mockStudents,
  getBillsByStudent
} from '@/lib/mock-data';
import { Bill, PaymentMethod } from '@/types';
import { 
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiCalendar,
  FiDollarSign
} from 'react-icons/fi';
import { format } from 'date-fns';

interface PaymentFormData {
  selectedBills: string[];
  paymentMethod: PaymentMethod | null;
  paymentDate: string;
  amountPaid: string;
  referenceNumber: string;
  bankName?: string;
  senderName?: string;
  senderMobile?: string;
  notes?: string;
  files: File[];
}

function PaymentUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get params
  const studentId = searchParams.get('studentId');
  const billId = searchParams.get('billId');
  const billIds = searchParams.get('bills');

  // Form data
  const [formData, setFormData] = useState<PaymentFormData>({
    selectedBills: [],
    paymentMethod: null,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    amountPaid: '',
    referenceNumber: '',
    notes: '',
    files: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get bills
  const availableBills = React.useMemo(() => {
    if (billId) {
      return mockBills.filter(b => b.id === billId);
    }
    if (billIds) {
      const ids = billIds.split(',');
      return mockBills.filter(b => ids.includes(b.id));
    }
    if (studentId) {
      return getBillsByStudent(studentId).filter(b => b.balance > 0);
    }
    return mockBills.filter(b => b.balance > 0);
  }, [studentId, billId, billIds]);

  // Initialize selected bills
  useEffect(() => {
    if (billId) {
      setFormData(prev => ({ ...prev, selectedBills: [billId] }));
    } else if (billIds) {
      setFormData(prev => ({ ...prev, selectedBills: billIds.split(',') }));
    } else if (availableBills.length > 0) {
      setFormData(prev => ({ ...prev, selectedBills: [availableBills[0].id] }));
    }
  }, [billId, billIds, availableBills]);

  // Calculate total amount
  const totalAmount = React.useMemo(() => {
    return formData.selectedBills.reduce((sum, billId) => {
      const bill = mockBills.find(b => b.id === billId);
      return sum + (bill?.balance || 0);
    }, 0);
  }, [formData.selectedBills]);

  // Initialize amount when bills are selected
  useEffect(() => {
    setFormData(prev => ({ ...prev, amountPaid: totalAmount.toString() }));
  }, [totalAmount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (formData.selectedBills.length === 0) {
          newErrors.bills = 'Please select at least one bill';
        }
        break;
      
      case 2:
        if (!formData.paymentMethod) {
          newErrors.paymentMethod = 'Please select a payment method';
        }
        break;
      
      case 3:
        if (!formData.paymentDate) {
          newErrors.paymentDate = 'Payment date is required';
        }
        if (!formData.amountPaid || parseFloat(formData.amountPaid) <= 0) {
          newErrors.amountPaid = 'Please enter a valid amount';
        }
        if (!formData.referenceNumber) {
          newErrors.referenceNumber = 'Reference number is required';
        }
        if (formData.paymentMethod === 'bank_deposit' && !formData.bankName) {
          newErrors.bankName = 'Bank name is required';
        }
        if ((formData.paymentMethod === 'gcash' || formData.paymentMethod === 'maya') && !formData.senderMobile) {
          newErrors.senderMobile = 'Sender mobile number is required';
        }
        break;
      
      case 4:
        if (formData.files.length === 0) {
          newErrors.files = 'Please upload at least one proof of payment';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentStep(6); // Success screen
    }, 2000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Bills to Pay
            </h2>
            
            <div className="space-y-3">
              {availableBills.map((bill) => {
                const student = mockStudents.find(s => s.id === bill.studentId);
                const isSelected = formData.selectedBills.includes(bill.id);
                
                return (
                  <Card
                    key={bill.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                    }`}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        selectedBills: isSelected
                          ? prev.selectedBills.filter(id => id !== bill.id)
                          : [...prev.selectedBills, bill.id]
                      }));
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                        ${isSelected 
                          ? 'bg-primary-500 border-primary-500' 
                          : 'border-gray-300'
                        }
                      `}>
                        {isSelected && <FiCheck className="w-3 h-3 text-white" />}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{bill.description}</h4>
                        <p className="text-sm text-gray-500">{student?.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500">
                            Due: {format(bill.dueDate, 'MMM d, yyyy')}
                          </span>
                          <span className="font-semibold text-primary-600">
                            {formatCurrency(bill.balance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {errors.bills && (
              <p className="mt-2 text-sm text-red-600">{errors.bills}</p>
            )}

            {formData.selectedBills.length > 0 && (
              <Card className="mt-4 bg-primary-50 border-primary-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Payment Method
            </h2>
            
            <PaymentMethodSelector
              selectedMethod={formData.paymentMethod}
              onSelect={(method) => setFormData(prev => ({ ...prev, paymentMethod: method }))}
            />

            {errors.paymentMethod && (
              <p className="mt-2 text-sm text-red-600">{errors.paymentMethod}</p>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  error={errors.paymentDate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid
                </label>
                <Input
                  type="number"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: e.target.value }))}
                  placeholder="0.00"
                  error={errors.amountPaid}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total bill amount: {formatCurrency(totalAmount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <Input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  placeholder="Enter reference number"
                  error={errors.referenceNumber}
                />
              </div>

              {formData.paymentMethod === 'bank_deposit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <select
                    value={formData.bankName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select bank</option>
                    <option value="BDO">BDO</option>
                    <option value="BPI">BPI</option>
                    <option value="Metrobank">Metrobank</option>
                    <option value="UnionBank">UnionBank</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                  )}
                </div>
              )}

              {(formData.paymentMethod === 'gcash' || formData.paymentMethod === 'maya') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Name
                    </label>
                    <Input
                      type="text"
                      value={formData.senderName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                      placeholder="Name registered in wallet"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Mobile Number
                    </label>
                    <Input
                      type="tel"
                      value={formData.senderMobile || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, senderMobile: e.target.value }))}
                      placeholder="09123456789"
                      error={errors.senderMobile}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add any additional information"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Payment Proof
            </h2>
            
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <FiCalendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Upload Guidelines</h4>
                  <ul className="text-sm text-blue-800 mt-1 space-y-1">
                    <li>• Take a clear photo of your deposit slip or receipt</li>
                    <li>• Ensure reference number is visible</li>
                    <li>• Include timestamp if available</li>
                  </ul>
                </div>
              </div>
            </Card>

            <FileUploadZone
              files={formData.files}
              onFilesChange={(files) => setFormData(prev => ({ ...prev, files }))}
            />

            {errors.files && (
              <p className="mt-2 text-sm text-red-600">{errors.files}</p>
            )}
          </div>
        );

      case 5:
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Review Payment
            </h2>
            
            <div className="space-y-4">
              {/* Bills Summary */}
              <Card>
                <h3 className="font-medium text-gray-900 mb-3">Bills</h3>
                <div className="space-y-2">
                  {formData.selectedBills.map(billId => {
                    const bill = mockBills.find(b => b.id === billId);
                    if (!bill) return null;
                    
                    return (
                      <div key={billId} className="flex justify-between text-sm">
                        <span className="text-gray-600">{bill.description}</span>
                        <span className="font-medium">{formatCurrency(bill.balance)}</span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Details */}
              <Card>
                <h3 className="font-medium text-gray-900 mb-3">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium capitalize">
                      {formData.paymentMethod?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Date</span>
                    <span className="font-medium">
                      {format(new Date(formData.paymentDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-medium">
                      {formatCurrency(parseFloat(formData.amountPaid))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference Number</span>
                    <span className="font-medium">{formData.referenceNumber}</span>
                  </div>
                  {formData.bankName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank</span>
                      <span className="font-medium">{formData.bankName}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Uploaded Files */}
              <Card>
                <h3 className="font-medium text-gray-900 mb-3">Uploaded Files</h3>
                <div className="space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <FiCheck className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">{file.name}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  By submitting this payment, you confirm that all information provided is accurate. 
                  Payment verification typically takes 2-3 business days.
                </p>
              </Card>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Submitted Successfully!
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Tracking Number</p>
              <p className="text-lg font-mono font-semibold">
                PAY-{format(new Date(), 'yyyyMMdd')}-{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p>✓ Payment proof uploaded</p>
              <p>✓ Verification in progress (2-3 business days)</p>
              <p>✓ You'll receive SMS/email updates</p>
            </div>
            
            <div className="space-y-3">
              <Button onClick={() => router.push('/tuition')} variant="primary" fullWidth>
                View Payment Status
              </Button>
              <Button onClick={() => router.push('/tuition')} variant="ghost" fullWidth>
                Back to Dashboard
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Upload Payment Proof" 
        showMenu={false}
        showBackButton={true}
        showNotification={false}
      />

      {/* Progress Bar */}
      {currentStep <= 5 && (
        <div className="bg-white shadow-sm px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={handleBack}
              disabled={currentStep === 1}
              className="text-sm text-primary-600 disabled:text-gray-400"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              Step {currentStep} of 5
            </span>
            <button 
              onClick={() => router.push('/tuition')}
              className="text-sm text-gray-600"
            >
              Cancel
            </button>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="px-4 py-4">
        {renderStepContent()}

        {/* Action Buttons */}
        {currentStep <= 4 && (
          <div className="mt-6 flex gap-3">
            {currentStep > 1 && (
              <Button
                variant="secondary"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              variant="primary"
              onClick={currentStep === 4 ? handleSubmit : handleNext}
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              {currentStep === 4 ? 'Submit Payment' : 'Next'}
            </Button>
          </div>
        )}

        {currentStep === 5 && (
          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary"
              onClick={handleBack}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              Confirm & Submit
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

export default function PaymentUploadPage() {
  return (
    <Suspense fallback={
      <MobileLayout className="bg-gray-50">
        <Header 
          title="Upload Payment Proof" 
          showMenu={false}
          showBackButton={true}
          showNotification={false}
        />
        <div className="px-4 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MobileLayout>
    }>
      <PaymentUploadContent />
    </Suspense>
  );
}