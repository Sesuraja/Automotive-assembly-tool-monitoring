import React from 'react';
import { Building2, Plus, Users, Layers, ExternalLink } from 'lucide-react';
import { Company } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface CompaniesProps {
  companies: Company[];
  onOpenWizard: () => void;
  onSelectCompany: (id: string) => void;
}

export const CompaniesPage: React.FC<CompaniesProps> = ({
  companies,
  onOpenWizard,
  onSelectCompany,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Enterprise Company Tenants</h2>
          <p className="text-xs text-gray-500 mt-1">
            Multi-tenant B2B hierarchy: Independent organizational structures, roles, devices, and safety policies
          </p>
        </div>

        <button
          onClick={onOpenWizard}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Company Tenant</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-medium">
              <th className="p-3 pl-4">Company Name</th>
              <th className="p-3">Tenant Code</th>
              <th className="p-3">Industry</th>
              <th className="p-3">Country / Timezone</th>
              <th className="p-3">Contact Email</th>
              <th className="p-3">Status</th>
              <th className="p-3 pr-4 text-right">Scope Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-3 pl-4">
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  {c.legal_name && <div className="text-[11px] text-gray-400">{c.legal_name}</div>}
                </td>
                <td className="p-3 font-mono font-bold text-blue-600">{c.code}</td>
                <td className="p-3 text-gray-600">{c.industry}</td>
                <td className="p-3 text-gray-500 font-mono">
                  {c.country} ({c.timezone})
                </td>
                <td className="p-3 text-gray-600">{c.contact_email}</td>
                <td className="p-3">
                  <StatusBadge status={c.status} size="sm" />
                </td>
                <td className="p-3 pr-4 text-right">
                  <button
                    onClick={() => onSelectCompany(c.id)}
                    className="flex items-center gap-1 ml-auto px-2.5 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded cursor-pointer font-medium"
                  >
                    <span>Switch Scope</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
