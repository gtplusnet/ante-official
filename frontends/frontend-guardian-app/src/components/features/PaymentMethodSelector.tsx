import React from 'react';
import { PaymentMethod } from '@/types';
import { 
  FiCreditCard, 
  FiDollarSign, 
  FiSmartphone,
  FiCheckSquare
} from 'react-icons/fi';

interface PaymentMethodOption {
  id: PaymentMethod;
  icon: React.ReactNode;
  title: string;
  description: string;
  popular?: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'bank_deposit',
    icon: <span className="text-2xl">🏦</span>,
    title: 'Bank Deposit',
    description: 'BDO, BPI, Metrobank, etc.',
  },
  {
    id: 'online_banking',
    icon: <span className="text-2xl">💻</span>,
    title: 'Online Banking',
    description: 'Internet banking transfer',
  },
  {
    id: 'gcash',
    icon: <span className="text-2xl">📱</span>,
    title: 'GCash',
    description: 'Send via GCash',
    popular: true,
  },
  {
    id: 'maya',
    icon: <span className="text-2xl">💳</span>,
    title: 'Maya',
    description: 'Send via Maya',
  },
  {
    id: 'over_the_counter',
    icon: <span className="text-2xl">🏪</span>,
    title: 'Payment Center',
    description: 'Bayad Center, 7-Eleven, etc.',
  },
  {
    id: 'check',
    icon: <span className="text-2xl">📄</span>,
    title: 'Check Payment',
    description: 'Personal or manager\'s check',
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
}) => {
  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => (
        <button
          key={method.id}
          onClick={() => onSelect(method.id)}
          className={`
            w-full p-4 rounded-lg border-2 transition-all duration-200
            ${selectedMethod === method.id
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">{method.icon}</div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">{method.title}</h4>
                {method.popular && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{method.description}</p>
            </div>
            <div className="flex-shrink-0">
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
                }
              `}>
                {selectedMethod === method.id && (
                  <FiCheckSquare className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};