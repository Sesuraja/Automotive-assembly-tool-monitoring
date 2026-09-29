from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.organization import OrganizationNode
from app.models.company import Company
from app.models.user import User
from app.schemas.organization import OrgNodeCreate, OrgNodeUpdate, OrgNodeResponse, OrgNodeTreeResponse
from app.core.tenant import verify_tenant_access
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("/tree", response_model=List[OrgNodeTreeResponse])
def get_organization_tree(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    if not target_comp:
        first_c = db.query(Company).first()
        target_comp = first_c.id if first_c else None
    if not target_comp:
        return []
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)

    nodes = db.query(OrganizationNode).filter(OrganizationNode.company_id == target_comp).all()
    # Build tree
    node_map = {}
    root_nodes = []

    for n in nodes:
        node_dict = {
            "id": n.id,
            "company_id": n.company_id,
            "parent_id": n.parent_id,
            "name": n.name,
            "code": n.code,
            "node_type": n.node_type,
            "manager_id": n.manager_id,
            "metadata_json": n.metadata_json or {},
            "created_at": n.created_at,
            "updated_at": n.updated_at,
            "children": []
        }
        node_map[n.id] = node_dict

    for n in nodes:
        if n.parent_id and n.parent_id in node_map:
            node_map[n.parent_id]["children"].append(node_map[n.id])
        else:
            root_nodes.append(node_map[n.id])

    return root_nodes

@router.post("", response_model=OrgNodeResponse, status_code=status.HTTP_201_CREATED)
def create_node(
    req: OrgNodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = req.company_id or current_user.company_id
    if not company_id:
        first_c = db.query(Company).first()
        company_id = first_c.id if first_c else None
    if not company_id:
        raise HTTPException(status_code=400, detail="Company ID required. Please create a company first.")
    if not current_user.is_super_admin:
        verify_tenant_access(company_id, current_user)

    node = OrganizationNode(
        company_id=company_id,
        parent_id=req.parent_id,
        name=req.name,
        code=req.code,
        node_type=req.node_type,
        manager_id=req.manager_id,
        metadata_json=req.metadata_json
    )
    db.add(node)
    db.commit()
    db.refresh(node)

    audit_service.log_event(
        db=db,
        action="CREATE_ORG_NODE",
        entity="OrganizationNode",
        company_id=company_id,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_id=node.id,
        new_value={"name": node.name, "node_type": node.node_type}
    )
    return node

@router.put("/{node_id}", response_model=OrgNodeResponse)
def update_node(
    node_id: str,
    req: OrgNodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    node = db.query(OrganizationNode).filter(OrganizationNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Organization node not found")
    if not current_user.is_super_admin:
        verify_tenant_access(node.company_id, current_user)

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(node, field, value)

    db.commit()
    db.refresh(node)
    return node

@router.delete("/{node_id}")
def delete_node(
    node_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    node = db.query(OrganizationNode).filter(OrganizationNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Organization node not found")
    if not current_user.is_super_admin:
        verify_tenant_access(node.company_id, current_user)

    db.delete(node)
    db.commit()
    return {"message": "Organization node deleted successfully"}
