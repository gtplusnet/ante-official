'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiCamera, FiCheck, FiUserPlus, FiAlertCircle, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
// studentsApi removed - using Supabase
import { getStudentsSupabaseService } from '@/lib/services/students.service';
import { getSupabaseService } from '@/lib/services/supabase.service';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { QRScanner } from '@/components/ui/QRScanner';
import { format } from 'date-fns';
import { storeUserInfo, storeCompanyInfo } from '@/lib/utils/storage';

// Relationship options - clear and simple from guardian's perspective
const RELATIONSHIPS = [
  { value: 'Father', label: "I'm the Father" },
  { value: 'Mother', label: "I'm the Mother" },
  { value: 'Guardian', label: "I'm the Legal Guardian" },
  { value: 'Grandfather', label: "I'm the Grandfather" },
  { value: 'Grandmother', label: "I'm the Grandmother" },
  { value: 'Uncle', label: "I'm the Uncle" },
  { value: 'Aunt', label: "I'm the Aunt" },
  { value: 'Other', label: "Other Relationship" },
];

export default function AddStudentPage() {
  const router = useRouter();
  const { user, isAuthenticated, refreshAuth, logout } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scannedQRCode, setScannedQRCode] = useState<string>('');
  const [selectedRelationship, setSelectedRelationship] = useState<string>('Father');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [verifyingStudent, setVerifyingStudent] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  
  const hasNoStudents = user && (!user.students || user.students.length === 0);

  // Extract student ID from QR code
  const extractStudentId = (qrCode: string): string | null => {
    const match = qrCode.match(/^student:([a-f0-9-]+)$/i);
    return match ? match[1] : null;
  };
  
  // Verify student exists
  const verifyStudent = async (studentId: string) => {
    try {
      setVerifyingStudent(true);
      setError('');
      
      if (!user?.id) {
        setError('User not authenticated');
        return false;
      }
      
      const studentsService = getStudentsSupabaseService();
      
      // Get student profile
      const student = await studentsService.getStudentProfile(studentId);
      
      if (!student) {
        setError('Student not found or not active in your institution. Please check the QR code and try again.');
        return false;
      }
      
      // Check if student is already connected to this guardian
      const existingStudents = await studentsService.getGuardianStudents(user.id);
      const isAlreadyConnected = existingStudents.some(s => s.id === studentId);
      
      if (isAlreadyConnected) {
        setError('This student is already connected to your account.');
        return false;
      }
      
      // Check if student is active
      if (!student.isActive) {
        setError('This student account is inactive. Please contact your school administrator.');
        return false;
      }
      
      setStudentInfo(student);
      return true;
    } catch (error: any) {
      console.error('Student verification error:', error);
      setError('Failed to verify student. Please try again.');
      return false;
    } finally {
      setVerifyingStudent(false);
    }
  };

  const handleScan = () => {
    setError('');
    setShowScanner(true);
  };
  
  const handleQRCodeScanned = async (result: string) => {
    console.log('QR Code scanned:', result);
    setShowScanner(false);
    
    // Validate QR code format
    if (!result.startsWith('student:')) {
      setError('Invalid QR code. Please scan a valid student QR code.');
      return;
    }
    
    // Extract student ID
    const studentId = extractStudentId(result);
    if (!studentId) {
      setError('Invalid QR code format.');
      return;
    }
    
    // Verify student exists
    const verified = await verifyStudent(studentId);
    if (verified) {
      setScannedQRCode(result);
      setHasScanned(true);
    }
  };

  const handleAddStudent = async () => {
    try {
      setIsConnecting(true);
      setError('');
      
      if (!user?.id || !studentInfo?.id) {
        setError('Missing user or student information');
        return;
      }
      
      console.log('Connecting student with relationship:', selectedRelationship);
      
      const supabaseService = getSupabaseService();
      const client = await supabaseService.getClient();
      
      if (!client) {
        setError('Database connection failed');
        return;
      }
      
      // Create StudentGuardian relationship record
      const { error: insertError } = await (client as any)
        .from('StudentGuardian')
        .insert({
          studentId: studentInfo.id,
          guardianId: user.id,
          relationship: selectedRelationship,
          isPrimary: true, // First guardian connection is primary
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Failed to create guardian-student relationship:', insertError);
        setError('Failed to connect student. Please try again.');
        return;
      }
      
      console.log('Student connected successfully!');
      
      // Refresh auth context to update user's students list
      await refreshAuth();
      
      // Small delay to ensure all state updates are complete
      setTimeout(() => {
        console.log('Navigating to dashboard...');
        router.push('/dashboard');
      }, 100);
    } catch (error: any) {
      console.error('Connect student error:', error);
      setError('Failed to connect student. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleReset = () => {
    setHasScanned(false);
    setScannedQRCode('');
    setSelectedRelationship('Father');
    setError('');
    setStudentInfo(null);
  };

  return (
    <MobileLayout className="bg-gray-50">
      <LoadingOverlay isLoading={isConnecting || verifyingStudent} message={verifyingStudent ? "Verifying student..." : "Connecting student..."} />
      
      <Header 
        title="Add Student" 
        showMenu={!hasNoStudents}
        showBackButton={!hasNoStudents}
        showNotification={false}
      />

      <div className="p-4">
        {/* Welcome message for users with no students */}
        {hasNoStudents && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <FiUserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">Welcome to Geer Guardian!</h2>
                <p className="text-blue-800 text-sm mb-3">
                  To get started, you need to add at least one student to your account. 
                  This will allow you to track attendance, receive notifications, and manage school-related activities.
                </p>
                <p className="text-blue-700 text-sm font-medium">
                  Please scan the QR code provided by your school to add your student.
                </p>
              </div>
            </div>
          </Card>
        )}
        
        {!hasScanned ? (
          <>
            {/* Error Message at top */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 mb-1">Scanning Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
            
            {/* Instructions */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Scan Student QR Code</h2>
              <p className="text-gray-600 text-sm mb-4">
                Please scan the QR code provided by the school to add your student to your guardian account.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Make sure you have the official QR code from your school. 
                  Each student has a unique QR code for security purposes.
                </p>
              </div>
            </Card>

            {/* QR Scanner Area */}
            <Card className="mb-6">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="text-center p-8">
                  <FiCamera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Tap below to scan QR code</p>
                  <p className="text-gray-400 text-sm">Camera will open automatically</p>
                </div>
              </div>
            </Card>

            {/* Scan Button */}
            <Button 
              onClick={handleScan} 
              fullWidth 
              size="lg"
              disabled={isScanning}
            >
              Start Scanning
            </Button>

            {/* Alternative Options */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don't have a QR code?{' '}
                <button className="text-primary-500 font-medium hover:underline">
                  Contact School Admin
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Success Message - Only show if no error */}
            {!error && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">QR Code Scanned Successfully!</p>
                  <p className="text-green-700 text-sm">Please select your relationship to the student.</p>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 mb-1">Verification Failed</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Student Information */}
            {studentInfo && (
              <Card className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Student Information</h3>
                
                <div className="mb-4">
                  <div className="flex items-center gap-4 mb-4">
                    {studentInfo.profilePhotoId ? (
                      <img 
                        src={`/api/photos/${studentInfo.profilePhotoId}`} 
                        alt={`${studentInfo.firstName} ${studentInfo.lastName}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-xl font-medium">
                          {studentInfo.firstName[0]}{studentInfo.lastName[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-lg">
                        {studentInfo.firstName} {studentInfo.middleName ? `${studentInfo.middleName} ` : ''}{studentInfo.lastName}
                      </h4>
                      <p className="text-gray-600">ID: {studentInfo.studentNumber}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Gender</span>
                      <span className="font-medium capitalize">{studentInfo.gender?.toLowerCase() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Date of Birth</span>
                      <span className="font-medium">
                        {studentInfo.dateOfBirth ? format(new Date(studentInfo.dateOfBirth), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Status</span>
                      <span className="font-medium text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Relationship Selection */}
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4">How are you related to this student?</h3>
              
              <div className="space-y-2">
                {RELATIONSHIPS.map((rel) => (
                  <label
                    key={rel.value}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="relationship"
                      value={rel.value}
                      checked={selectedRelationship === rel.value}
                      onChange={(e) => setSelectedRelationship(e.target.value)}
                      className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-3 font-medium">{rel.label}</span>
                  </label>
                ))}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!error && studentInfo && (
                <Button 
                  onClick={handleAddStudent} 
                  fullWidth 
                  size="lg"
                  disabled={isConnecting || !selectedRelationship}
                >
                  {isConnecting ? 'Connecting...' : 'Add to My Students'}
                </Button>
              )}
              <Button 
                onClick={handleReset} 
                fullWidth 
                size="lg" 
                variant={error ? "primary" : "secondary"}
              >
                {error ? 'Try Again' : 'Scan Another Student'}
              </Button>
            </div>
          </>
        )}
        
        {/* Logout button for users with no students */}
        {hasNoStudents && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <Button
              onClick={logout}
              fullWidth
              size="lg"
              variant="secondary"
              className="flex items-center justify-center gap-2"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
            <p className="text-center text-gray-500 text-sm mt-3">
              Need help? Contact your school administrator.
            </p>
          </div>
        )}
      </div>
      
      {/* QR Scanner */}
      <QRScanner 
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRCodeScanned}
      />
    </MobileLayout>
  );
}