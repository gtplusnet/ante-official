'use client';

import { useState, FormEvent } from 'react';

interface InquiryFormProps {
  inquiryFormTitle: string;
  submitButtonText: string;
}

export default function InquiryForm({ inquiryFormTitle, submitButtonText }: InquiryFormProps) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    industry: '',
    phone: '',
    jobTitle: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!form.industry.trim()) newErrors.industry = 'Industry is required';
    if (!form.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Send to new API endpoint that handles email
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setSubmitSuccess(true);
      // Reset form
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        companyName: '',
        industry: '',
        phone: '',
        jobTitle: '',
        message: '',
      });
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    // Apply character limit for message field
    if (field === 'message' && value.length > 500) {
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field] && touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFocusedField(null);

    // Validate field on blur
    const newErrors: Record<string, string> = {};
    if (field === 'firstName' && !form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (field === 'lastName' && !form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (field === 'email') {
      if (!form.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = 'Enter a valid email';
      }
    } else if (field === 'companyName' && !form.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (field === 'industry' && !form.industry.trim()) {
      newErrors.industry = 'Industry is required';
    } else if (field === 'jobTitle' && !form.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const getInputClassName = (field: string, hasError: boolean) => {
    const baseClasses =
      'w-full px-4 py-3 rounded-[10px] border transition-all duration-200 focus:outline-none';

    if (hasError) {
      return `${baseClasses} border-red-400 bg-red-50 text-red-900`;
    }

    if (focusedField === field) {
      return `${baseClasses} border-gray-300 bg-white shadow-md ring-2 ring-oxford-blue/20`;
    }

    return `${baseClasses} bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white`;
  };

  return (
    <div className="bg-gray-50 py-12 px-4 md:px-24 mt-12 md:mt-0">
      <div className="max-w-[800px] w-full mx-auto">
        <div className="py-12">
          <h2 className="text-[2rem] md:text-[2.5rem] font-bold text-oxford-blue mb-12 text-center font-noto-sans">
            {inquiryFormTitle}
          </h2>

          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center transform transition-all duration-300 animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">
                  Thank you! Your inquiry has been submitted successfully.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label
                  className={`block mb-2 font-medium transition-colors duration-200 ${
                    focusedField === 'firstName' ? 'text-oxford-blue' : 'text-gray-700'
                  }`}
                >
                  First name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    onFocus={() => handleFocus('firstName')}
                    onBlur={() => handleBlur('firstName')}
                    className={getInputClassName(
                      'firstName',
                      !!(errors.firstName && touched.firstName)
                    )}
                  />
                </div>
                {errors.firstName && touched.firstName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-fade-in">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="relative">
                <label
                  className={`block mb-2 font-medium transition-colors duration-200 ${
                    focusedField === 'lastName' ? 'text-oxford-blue' : 'text-gray-700'
                  }`}
                >
                  Last name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    onFocus={() => handleFocus('lastName')}
                    onBlur={() => handleBlur('lastName')}
                    className={getInputClassName(
                      'lastName',
                      !!(errors.lastName && touched.lastName)
                    )}
                  />
                </div>
                {errors.lastName && touched.lastName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-fade-in">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <label
                className={`block mb-2 font-medium transition-colors duration-200 ${
                  focusedField === 'email' ? 'text-oxford-blue' : 'text-gray-700'
                }`}
              >
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  className={getInputClassName('email', !!(errors.email && touched.email))}
                />
              </div>
              {errors.email && touched.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-fade-in">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                className={`block mb-2 font-medium transition-colors duration-200 ${
                  focusedField === 'companyName' ? 'text-oxford-blue' : 'text-gray-700'
                }`}
              >
                Company name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  onFocus={() => handleFocus('companyName')}
                  onBlur={() => handleBlur('companyName')}
                  className={getInputClassName(
                    'companyName',
                    !!(errors.companyName && touched.companyName)
                  )}
                />
              </div>
              {errors.companyName && touched.companyName && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-fade-in">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.companyName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label
                  className={`block mb-2 font-medium transition-colors duration-200 ${
                    focusedField === 'industry' ? 'text-oxford-blue' : 'text-gray-700'
                  }`}
                >
                  Industry <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    onFocus={() => handleFocus('industry')}
                    onBlur={() => handleBlur('industry')}
                    className={getInputClassName(
                      'industry',
                      !!(errors.industry && touched.industry)
                    )}
                  />
                </div>
                {errors.industry && touched.industry && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-fade-in">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.industry}
                  </p>
                )}
              </div>

              <div className="relative">
                <label
                  className={`block mb-2 font-medium transition-colors duration-200 ${
                    focusedField === 'phone' ? 'text-oxford-blue' : 'text-gray-700'
                  }`}
                >
                  Phone number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onFocus={() => handleFocus('phone')}
                    onBlur={() => handleBlur('phone')}
                    className={getInputClassName('phone', false)}
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              <label
                className={`block mb-2 font-medium transition-colors duration-200 ${
                  focusedField === 'jobTitle' ? 'text-oxford-blue' : 'text-gray-700'
                }`}
              >
                Job title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={(e) => handleChange('jobTitle', e.target.value)}
                  onFocus={() => handleFocus('jobTitle')}
                  onBlur={() => handleBlur('jobTitle')}
                  className={getInputClassName('jobTitle', !!(errors.jobTitle && touched.jobTitle))}
                />
              </div>
              {errors.jobTitle && touched.jobTitle && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-fade-in">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.jobTitle}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                className={`block mb-2 font-medium transition-colors duration-200 ${
                  focusedField === 'message' ? 'text-oxford-blue' : 'text-gray-700'
                }`}
              >
                How can we help?
              </label>
              <div className="relative">
                <textarea
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onFocus={() => handleFocus('message')}
                  onBlur={() => handleBlur('message')}
                  rows={4}
                  className={`${getInputClassName('message', false)} resize-none`}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">{form.message.length}/500 characters</p>
            </div>

            <div className="text-center mt-12">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#F1F06C] hover:bg-[#f1f177] active:bg-[#E8D03A] text-oxford-blue font-bold text-[20px] px-[50px] py-[10px] rounded-[50px] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_2px_5px_rgba(0,0,0,0.2)] active:translate-y-0 active:shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  submitButtonText
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
