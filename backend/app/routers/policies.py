from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.deps import get_db

router = APIRouter(prefix="/policies", tags=["policies"])


# ===========================
# CRITICAL: Specific routes MUST come before parameterized routes
# Put /evaluations routes BEFORE /{policy_id} routes
# ===========================

@router.get("/evaluations", response_model=list[schemas.EvaluationRead])
def list_evaluations(
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """
    Retrieve all policy evaluations with optional pagination.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 1000)
    """
    return crud.get_evaluations(db, skip=skip, limit=limit)


@router.get("/evaluations/{evaluation_id}", response_model=schemas.EvaluationRead)
def get_evaluation(
    evaluation_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific evaluation by ID.
    """
    evaluation = crud.get_evaluation(db, evaluation_id=evaluation_id)
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation with ID {evaluation_id} not found"
        )
    return evaluation


@router.post("/evaluations", response_model=schemas.EvaluationRead, status_code=status.HTTP_201_CREATED)
def create_evaluation(
    evaluation_in: schemas.EvaluationCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new policy evaluation.
    
    The evaluation must have a unique combination of policy_id and account_id.
    """
    try:
        return crud.create_evaluation(db, evaluation_in=evaluation_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/evaluations/{evaluation_id}", response_model=schemas.EvaluationRead)
def update_evaluation(
    evaluation_id: int,
    evaluation_in: schemas.EvaluationUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing policy evaluation.
    
    Only provided fields will be updated. The last_checked_at timestamp
    will be automatically updated.
    """
    evaluation = crud.update_evaluation(
        db, evaluation_id=evaluation_id, evaluation_in=evaluation_in
    )
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation with ID {evaluation_id} not found"
        )
    return evaluation


@router.delete("/evaluations/{evaluation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evaluation(
    evaluation_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a policy evaluation.
    """
    deleted = crud.delete_evaluation(db, evaluation_id=evaluation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation with ID {evaluation_id} not found"
        )


# ===========================
# Policy routes (with parameterized route at the end)
# ===========================

@router.get("/", response_model=list[schemas.PolicyRead])
def list_policies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieve all policies with optional pagination.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100)
    """
    return crud.get_policies(db, skip=skip, limit=limit)


@router.post("/", response_model=schemas.PolicyRead, status_code=status.HTTP_201_CREATED)
def create_policy(
    policy_in: schemas.PolicyCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new security policy.
    
    The policy must have a unique combination of control_id and provider.
    """
    try:
        return crud.create_policy(db, policy_in=policy_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# IMPORTANT: This route must come AFTER all specific routes like /evaluations
@router.get("/{policy_id}", response_model=schemas.PolicyRead)
def get_policy(
    policy_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific policy by ID.
    """
    policy = crud.get_policy(db, policy_id=policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy with ID {policy_id} not found"
        )
    return policy


@router.put("/{policy_id}", response_model=schemas.PolicyRead)
def update_policy(
    policy_id: int,
    policy_in: schemas.PolicyUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing policy.
    
    Only provided fields will be updated.
    """
    policy = crud.update_policy(db, policy_id=policy_id, policy_in=policy_in)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy with ID {policy_id} not found"
        )
    return policy


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a policy.
    
    This will also delete all associated policy evaluations.
    """
    deleted = crud.delete_policy(db, policy_id=policy_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy with ID {policy_id} not found"
        )