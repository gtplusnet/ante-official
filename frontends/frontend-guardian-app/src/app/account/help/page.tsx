'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { 
  FiHelpCircle, 
  FiBook, 
  FiMessageCircle, 
  FiPhone,
  FiMail,
  FiChevronRight,
  FiChevronDown,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I add a new student?',
    answer: 'To add a new student, go to the navigation menu and tap "Add Student". You\'ll need to scan the QR code provided by the school for your student.',
    category: 'Students',
  },
  {
    id: '2',
    question: 'Why can\'t I turn off attendance notifications?',
    answer: 'Attendance and emergency notifications are mandatory for student safety. These notifications ensure you\'re always informed about your child\'s whereabouts.',
    category: 'Notifications',
  },
  {
    id: '3',
    question: 'How do I update my contact information?',
    answer: 'Go to Account Settings > Edit Profile. You can update your name, email, phone number, and address. Make sure to save your changes.',
    category: 'Account',
  },
  {
    id: '4',
    question: 'What should I do if I\'m not receiving notifications?',
    answer: 'First, check your notification settings. Make sure you\'ve granted notification permissions to the app. If the issue persists, contact school support.',
    category: 'Notifications',
  },
  {
    id: '5',
    question: 'How can I view my child\'s attendance history?',
    answer: 'Navigate to Log History from the main menu. You can filter logs by date range to see specific periods.',
    category: 'Attendance',
  },
  {
    id: '6',
    question: 'Is my data secure?',
    answer: 'Yes, we use industry-standard encryption to protect your data. Only authorized school personnel can access student information.',
    category: 'Privacy',
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))];
  
  const filteredFAQs = selectedCategory === 'All' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Help & Support" 
        showMenu={false}
        showNotification={false}
        showBackButton={true}
      />

      <div className="px-4 py-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FiBook className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-medium text-gray-900">User Guide</p>
            <p className="text-xs text-gray-500 mt-1">Learn the basics</p>
          </Card>
          
          <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FiMessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-gray-900">Contact Support</p>
            <p className="text-xs text-gray-500 mt-1">Get help from us</p>
          </Card>
        </div>

        {/* FAQs */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          
          {/* Category Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* FAQ Items */}
          <div className="space-y-2">
            {filteredFAQs.map(faq => (
              <div key={faq.id} className="border-b border-gray-100 last:border-0">
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-gray-900">{faq.question}</p>
                    <p className="text-xs text-gray-500 mt-1">{faq.category}</p>
                  </div>
                  {expandedFAQ === faq.id ? (
                    <FiChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <FiChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFAQ === faq.id && (
                  <div className="pb-3 px-1">
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Contact School Support</h3>
          <div className="space-y-3">
            <a 
              href="tel:+639123456789"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FiPhone className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Call Support</p>
                <p className="text-sm text-gray-500">+63 912 345 6789</p>
                <p className="text-xs text-gray-400">Mon-Fri, 8AM-5PM</p>
              </div>
            </a>
            
            <a 
              href="mailto:support@materdeiacademy.edu"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FiMail className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Email Support</p>
                <p className="text-sm text-gray-500">support@materdeiacademy.edu</p>
                <p className="text-xs text-gray-400">Response within 24 hours</p>
              </div>
            </a>
          </div>
        </Card>

        {/* App Information */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiInfo className="w-5 h-5 text-primary-500" />
            App Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Version</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Updated</span>
              <span className="font-medium text-gray-900">July 1, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">School</span>
              <span className="font-medium text-gray-900">Mater Dei Academy</span>
            </div>
          </div>
        </Card>

        {/* Emergency Notice */}
        <div className="mt-6 bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Emergency Contacts</h4>
              <p className="text-sm text-red-800">
                For urgent matters or emergencies, please contact the school directly at:
              </p>
              <p className="text-sm font-semibold text-red-900 mt-2">
                Emergency Hotline: (02) 8123-4567
              </p>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}