from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.deps import get_db

router = APIRouter(prefix="/policies", tags=["policies"])


@router.get("/", response_model=list[schemas.PolicyRead])
def list_policies(db: Session = Depends(get_db)):
    return crud.get_policies(db)


@router.post("/", response_model=schemas.PolicyRead, status_code=status.HTTP_201_CREATED)
def create_policy(policy_in: schemas.PolicyCreate, db: Session = Depends(get_db)):
    return crud.create_policy(db, policy_in=policy_in)


@router.put("/{policy_id}", response_model=schemas.PolicyRead)
def update_policy(
    policy_id: int,
    policy_in: schemas.PolicyUpdate,
    db: Session = Depends(get_db),
):
    policy = crud.update_policy(db, policy_id=policy_id, policy_in=policy_in)
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")
    return policy


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_policy(db, policy_id=policy_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")


@router.get("/evaluations", response_model=list[schemas.EvaluationRead])
def list_evaluations(db: Session = Depends(get_db)):
    return crud.get_evaluations(db)


@router.post("/evaluations", response_model=schemas.EvaluationRead, status_code=status.HTTP_201_CREATED)
def create_evaluation(evaluation_in: schemas.EvaluationCreate, db: Session = Depends(get_db)):
    return crud.create_evaluation(db, evaluation_in=evaluation_in)


@router.patch("/evaluations/{evaluation_id}", response_model=schemas.EvaluationRead)
def update_evaluation(
    evaluation_id: int,
    evaluation_in: schemas.EvaluationUpdate,
    db: Session = Depends(get_db),
):
    evaluation = crud.update_evaluation(db, evaluation_id=evaluation_id, evaluation_in=evaluation_in)
    if not evaluation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluation not found")
    return evaluation
