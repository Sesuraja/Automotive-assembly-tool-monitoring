import React, { useEffect, useState } from 'react';
import { Network, Plus, Folder, Users, Trash2, Edit3, ChevronRight, ChevronDown, Building2 } from 'lucide-react';
import { OrgNode, Company } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

interface OrganizationPageProps {
  selectedCompanyId: string | null;
  companies: Company[];
}

export const OrganizationPage: React.FC<OrganizationPageProps> = ({
  selectedCompanyId,
  companies,
}) => {
  const [treeData, setTreeData] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState('department');
  const [newNodeCode, setNewNodeCode] = useState('');

  useEffect(() => {
    loadTree();
  }, [selectedCompanyId]);

  const loadTree = async () => {
    setLoading(true);
    try {
      const data = await api.getOrgTree(selectedCompanyId || undefined);
      setTreeData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = async () => {
    if (!newNodeName) return;
    try {
      await api.createOrgNode({
        company_id: selectedCompanyId,
        parent_id: selectedParentId,
        name: newNodeName,
        node_type: newNodeType,
        code: newNodeCode,
      });
      setAddModalOpen(false);
      setNewNodeName('');
      setNewNodeCode('');
      loadTree();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organizational unit?')) return;
    try {
      await api.deleteOrgNode(id);
      loadTree();
    } catch (e) {
      console.error(e);
    }
  };

  const renderTreeItem = (node: OrgNode, level: number = 0) => {
    const typeColors: Record<string, string> = {
      business_unit: 'bg-purple-50 text-purple-700 border-purple-200',
      division: 'bg-blue-50 text-blue-700 border-blue-200',
      department: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      team: 'bg-amber-50 text-amber-700 border-amber-200',
      custom: 'bg-gray-50 text-gray-700 border-gray-200',
    };

    return (
      <div key={node.id} className="space-y-1.5" style={{ marginLeft: `${level * 24}px` }}>
        <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all text-xs group shadow-xs">
          <div className="flex items-center gap-2.5">
            <Folder className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-gray-900">{node.name}</span>
            {node.code && <span className="font-mono text-[10px] text-gray-400">({node.code})</span>}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                typeColors[node.node_type] || typeColors.custom
              }`}
            >
              {node.node_type.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setSelectedParentId(node.id);
                setAddModalOpen(true);
              }}
              className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100 cursor-pointer"
              title="Add child unit"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteNode(node.id)}
              className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 cursor-pointer"
              title="Delete unit"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {node.children && node.children.map((child) => renderTreeItem(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Organization Builder</h2>
          <p className="text-xs text-gray-500 mt-1">
            Hierarchical organizational structure: Business Units &rarr; Divisions &rarr; Departments &rarr; Teams
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedParentId(null);
            setAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Root Unit</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs min-h-[400px]">
        {treeData.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            No organizational hierarchy created yet. Click "Add Root Unit" to establish divisions and departments.
          </div>
        ) : (
          <div className="space-y-2">{treeData.map((root) => renderTreeItem(root, 0))}</div>
        )}
      </div>

      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={selectedParentId ? 'Add Sub-Unit' : 'Add Root Organizational Unit'}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Unit Name *</label>
            <input
              type="text"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              placeholder="e.g. Powertrain Assembly Department"
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Unit Type</label>
              <select
                value={newNodeType}
                onChange={(e) => setNewNodeType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2.5"
              >
                <option value="business_unit">Business Unit</option>
                <option value="division">Division</option>
                <option value="department">Department</option>
                <option value="team">Team</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Unit Code</label>
              <input
                type="text"
                value={newNodeCode}
                onChange={(e) => setNewNodeCode(e.target.value)}
                placeholder="e.g. DEPT-PT-01"
                className="w-full border border-gray-200 rounded-lg p-2.5 uppercase"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => setAddModalOpen(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNode}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer shadow-xs"
            >
              Create Unit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
