import React, { useState } from 'react';
import { Modal } from './Modal';
import { Check, ArrowRight, ArrowLeft, Building2, User, MapPin, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

interface CompanyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompanyWizardModal: React.FC<CompanyWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Company Info
    name: '',
    legal_name: '',
    code: '',
    industry: 'Automotive Manufacturing',
    country: 'Canada',
    timezone: 'America/Toronto',
    contact_email: '',
    phone: '',
    // Step 2: Administrator
    admin_name: '',
    admin_email: '',
    admin_password: '',
    // Step 3: Organization & Site
    initial_division_name: 'Powertrain Manufacturing Division',
    initial_site_name: 'Windsor Assembly Plant #2',
    initial_site_code: 'WND-02',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!formData.name || !formData.code || !formData.contact_email) {
        setError('Please fill in Company Name, Company Code, and Contact Email.');
        return;
      }
    } else if (step === 2) {
      if (!formData.admin_name || !formData.admin_email || !formData.admin_password) {
        setError('Please enter Admin Name, Email, and Temporary Password.');
        return;
      }
    } else if (step === 3) {
      if (!formData.initial_site_name) {
        setError('Please provide an initial site name.');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.createCompany(formData);
      setStep(5); // Success step
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create company.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Enterprise Tenant"
      subtitle="5-Step Multi-Tenant Organization & Infrastructure Wizard"
      maxWidth="2xl"
    >
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        {[
          { num: 1, label: 'Company Info' },
          { num: 2, label: 'Administrator' },
          { num: 3, label: 'Site & Org' },
          { num: 4, label: 'Review' },
          { num: 5, label: 'Complete' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                step === s.num
                  ? 'bg-blue-600 text-white shadow-xs'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-xs hidden sm:inline ${
                step === s.num ? 'font-semibold text-gray-900' : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Company Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Magna Powertrain"
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. MAGNA-PT"
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Legal Corporate Name</label>
              <input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                onChange={handleChange}
                placeholder="e.g. Magna International Inc."
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Automotive Manufacturing">Automotive Manufacturing</option>
                <option value="Powertrain & Engine Assembly">Powertrain & Engine Assembly</option>
                <option value="Heavy Machinery">Heavy Machinery</option>
                <option value="Aerospace Assembly">Aerospace Assembly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email *</label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                placeholder="plant.operations@company.com"
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Administrator */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
            Designate the primary Company Administrator who will manage users, sites, and assets.
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Administrator Full Name *</label>
            <input
              type="text"
              name="admin_name"
              value={formData.admin_name}
              onChange={handleChange}
              placeholder="e.g. Marcus Vance"
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Admin Email Address *</label>
            <input
              type="email"
              name="admin_email"
              value={formData.admin_email}
              onChange={handleChange}
              placeholder="marcus.vance@company.com"
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Temporary Password *</label>
            <input
              type="password"
              name="admin_password"
              value={formData.admin_password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Step 3: Organization & Site */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
            Set up the initial operating node and physical assembly site.
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Initial Division / Business Unit</label>
            <input
              type="text"
              name="initial_division_name"
              value={formData.initial_division_name}
              onChange={handleChange}
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Facility / Site Name *</label>
              <input
                type="text"
                name="initial_site_name"
                value={formData.initial_site_name}
                onChange={handleChange}
                placeholder="e.g. Toronto Assembly Facility"
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Site Code</label>
              <input
                type="text"
                name="initial_site_code"
                value={formData.initial_site_code}
                onChange={handleChange}
                placeholder="e.g. TOR-01"
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none uppercase"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4 text-xs">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
            <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Tenant Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div><span className="font-medium text-gray-900">Company:</span> {formData.name} ({formData.code})</div>
              <div><span className="font-medium text-gray-900">Industry:</span> {formData.industry}</div>
              <div><span className="font-medium text-gray-900">Contact:</span> {formData.contact_email}</div>
              <div><span className="font-medium text-gray-900">Country:</span> {formData.country}</div>
              <div><span className="font-medium text-gray-900">Admin:</span> {formData.admin_name} ({formData.admin_email})</div>
              <div><span className="font-medium text-gray-900">Initial Site:</span> {formData.initial_site_name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Success Confirmation */}
      {step === 5 && (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-gray-900">Company Tenant Provisioned!</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Tenant <strong>{formData.name}</strong>, administrator account, and initial facility have been successfully created.
          </p>
          <div className="pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 cursor-pointer"
            >
              Return to Platform Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {step < 5 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg cursor-pointer shadow-xs"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? 'Provisioning...' : 'Confirm & Create Company'}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
};
