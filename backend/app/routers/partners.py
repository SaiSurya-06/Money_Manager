from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, date
import secrets
from ..database import get_db
from .. import models, schemas, auth
from .transactions import format_tx_to_dict, project_single_recurrence

router = APIRouter(prefix="/partners", tags=["partners"])

# Helper to verify active partnership exists between two users
def verify_partnership(db: Session, user_id: int, partner_id: int):
    link = db.query(models.PartnerLink).filter(
        models.PartnerLink.status == "accepted",
        (
            ((models.PartnerLink.requester_id == user_id) & (models.PartnerLink.recipient_id == partner_id)) |
            ((models.PartnerLink.requester_id == partner_id) & (models.PartnerLink.recipient_id == user_id))
        )
    ).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have an active partner connection with this user."
        )
    return link

@router.post("/invite", response_model=schemas.InviteLinkResponse)
def generate_invite(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user has too many active invites, optional cleanup
    # Generate unique 8-character urlsafe code
    code = secrets.token_urlsafe(8)
    while db.query(models.PartnerLink).filter(models.PartnerLink.invite_code == code).first():
        code = secrets.token_urlsafe(8)

    new_invite = models.PartnerLink(
        requester_id=current_user.id,
        invite_code=code,
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(new_invite)
    db.commit()
    db.refresh(new_invite)

    # In production, this domain is configurable
    invite_link = f"http://localhost:5173/invite/{code}"
    return {"invite_code": code, "invite_link": invite_link}

@router.post("/accept", response_model=schemas.PartnerResponse)
def accept_invite(
    payload: schemas.InviteCodeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    invite = db.query(models.PartnerLink).filter(
        models.PartnerLink.invite_code == payload.invite_code
    ).first()

    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invite code.")

    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="This invite has already been processed.")

    # Check expiration (72 hours)
    if datetime.utcnow() - invite.created_at > timedelta(hours=72):
        invite.status = "rejected"
        db.add(invite)
        db.commit()
        raise HTTPException(status_code=400, detail="This invite code has expired.")

    # Prevent self-pairing
    if invite.requester_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot accept your own invite code.")

    # Check if they are already partners
    existing = db.query(models.PartnerLink).filter(
        models.PartnerLink.status == "accepted",
        (
            ((models.PartnerLink.requester_id == invite.requester_id) & (models.PartnerLink.recipient_id == current_user.id)) |
            ((models.PartnerLink.requester_id == current_user.id) & (models.PartnerLink.recipient_id == invite.requester_id))
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You are already partners with this user.")

    # Accept the link
    invite.recipient_id = current_user.id
    invite.status = "accepted"
    invite.accepted_at = datetime.utcnow()
    db.add(invite)

    # Automatically set up default AccountSharingSettings: share all accounts of both users with each other
    requester_accounts = db.query(models.Account).filter(models.Account.user_id == invite.requester_id).all()
    for acc in requester_accounts:
        settings = models.AccountSharingSettings(
            user_id=invite.requester_id,
            account_id=acc.id,
            partner_id=current_user.id,
            is_shared=True
        )
        db.add(settings)

    recipient_accounts = db.query(models.Account).filter(models.Account.user_id == current_user.id).all()
    for acc in recipient_accounts:
        settings = models.AccountSharingSettings(
            user_id=current_user.id,
            account_id=acc.id,
            partner_id=invite.requester_id,
            is_shared=True
        )
        db.add(settings)

    db.commit()
    db.refresh(invite)

    return {
        "id": invite.requester.id,
        "name": invite.requester.name,
        "email": invite.requester.email,
        "status": "active"
    }

@router.post("/reject")
def reject_invite(
    payload: schemas.InviteCodeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    invite = db.query(models.PartnerLink).filter(
        models.PartnerLink.invite_code == payload.invite_code
    ).first()

    if not invite:
        raise HTTPException(status_code=404, detail="Invite code not found.")

    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="This invite has already been processed.")

    if invite.recipient_id and invite.recipient_id != current_user.id:
         raise HTTPException(status_code=403, detail="Unauthorized.")

    invite.status = "rejected"
    db.add(invite)
    db.commit()
    return {"message": "Invite rejected successfully."}

@router.delete("/{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_partner(
    partner_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Find accepted connection in either direction
    link = db.query(models.PartnerLink).filter(
        models.PartnerLink.status == "accepted",
        (
            ((models.PartnerLink.requester_id == current_user.id) & (models.PartnerLink.recipient_id == partner_id)) |
            ((models.PartnerLink.requester_id == partner_id) & (models.PartnerLink.recipient_id == current_user.id))
        )
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Partner connection not found.")

    # Mark as revoked
    link.status = "revoked"
    db.add(link)

    # Delete all account sharing settings between these two users
    db.query(models.AccountSharingSettings).filter(
        ((models.AccountSharingSettings.user_id == current_user.id) & (models.AccountSharingSettings.partner_id == partner_id)) |
        ((models.AccountSharingSettings.user_id == partner_id) & (models.AccountSharingSettings.partner_id == current_user.id))
    ).delete()

    db.commit()
    return None

@router.get("", response_model=List[schemas.PartnerResponse])
def list_partners(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    links = db.query(models.PartnerLink).filter(
        models.PartnerLink.status == "accepted",
        ((models.PartnerLink.requester_id == current_user.id) | (models.PartnerLink.recipient_id == current_user.id))
    ).all()

    partners = []
    for l in links:
        other_user = l.recipient if l.requester_id == current_user.id else l.requester
        partners.append({
            "id": other_user.id,
            "name": other_user.name,
            "email": other_user.email,
            "status": "active"
        })
    return partners

@router.get("/invites/pending")
def list_pending_invites(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Outgoing pending invites generated by me
    outgoing = db.query(models.PartnerLink).filter(
        models.PartnerLink.requester_id == current_user.id,
        models.PartnerLink.status == "pending"
    ).all()

    # Incoming pending invites targeted at me (where recipient is explicitly my ID)
    incoming = db.query(models.PartnerLink).filter(
        models.PartnerLink.recipient_id == current_user.id,
        models.PartnerLink.status == "pending"
    ).all()

    # We map them to serialized dicts
    return {
        "outgoing": [
            {
                "id": o.id,
                "invite_code": o.invite_code,
                "invite_link": f"http://localhost:5173/invite/{o.invite_code}",
                "created_at": o.created_at,
                "status": o.status
            }
            for o in outgoing
        ],
        "incoming": [
            {
                "id": i.id,
                "invite_code": i.invite_code,
                "requester_name": i.requester.name,
                "requester_email": i.requester.email,
                "created_at": i.created_at,
                "status": i.status
            }
            for i in incoming
        ]
    }

@router.get("/{partner_id}/accounts", response_model=List[schemas.Account])
def get_partner_accounts(
    partner_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    verify_partnership(db, current_user.id, partner_id)

    # Get accounts belonging to the partner that are marked shared
    shared_settings = db.query(models.AccountSharingSettings).filter(
        models.AccountSharingSettings.user_id == partner_id,
        models.AccountSharingSettings.partner_id == current_user.id,
        models.AccountSharingSettings.is_shared == True
    ).all()

    account_ids = [s.account_id for s in shared_settings]
    accounts = db.query(models.Account).filter(
        models.Account.id.in_(account_ids) if account_ids else False
    ).all()

    return accounts

@router.get("/{partner_id}/transactions", response_model=List[schemas.TransactionResponse])
def get_partner_transactions(
    partner_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    category_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    verify_partnership(db, current_user.id, partner_id)

    # Get account IDs of partner shared with current_user
    shared_settings = db.query(models.AccountSharingSettings).filter(
        models.AccountSharingSettings.user_id == partner_id,
        models.AccountSharingSettings.partner_id == current_user.id,
        models.AccountSharingSettings.is_shared == True
    ).all()

    account_ids = [s.account_id for s in shared_settings]
    if not account_ids:
        return []

    # Query partner's transactions
    query = db.query(models.Transaction).filter(
        models.Transaction.user_id == partner_id,
        models.Transaction.account_id.in_(account_ids),
        models.Transaction.is_private == False  # Enforce privacy gate!
    )

    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)
    if type:
        query = query.filter(models.Transaction.type == type)
    if search:
        query = query.filter(models.Transaction.title.ilike(f"%{search}%"))

    db_transactions = query.all()

    # Define range for projection
    today = date.today()
    s_date = start_date if start_date else today - timedelta(days=90)
    e_date = end_date if end_date else today + timedelta(days=365)

    all_occurrences = []
    for tx in db_transactions:
        projected = project_single_recurrence(tx, s_date, e_date)
        all_occurrences.extend(projected)

    # Sort occurrences by date descending
    all_occurrences.sort(key=lambda x: (x["date"], x["id"]), reverse=True)
    return all_occurrences

@router.get("/sharing-settings", response_model=List[schemas.SharingSettingsResponse])
def get_sharing_settings(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch active partner IDs
    partners = list_partners(current_user, db)
    partner_ids = [p["id"] for p in partners]

    if not partner_ids:
        return []

    accounts = db.query(models.Account).filter(models.Account.user_id == current_user.id).all()

    response = []
    for p in partners:
        for acc in accounts:
            # Query if setting exists
            setting = db.query(models.AccountSharingSettings).filter(
                models.AccountSharingSettings.user_id == current_user.id,
                models.AccountSharingSettings.account_id == acc.id,
                models.AccountSharingSettings.partner_id == p["id"]
            ).first()

            # Default to True if no record exists
            is_shared = setting.is_shared if setting else True
            if not setting:
                # Materialize it for future queries
                new_setting = models.AccountSharingSettings(
                    user_id=current_user.id,
                    account_id=acc.id,
                    partner_id=p["id"],
                    is_shared=True
                )
                db.add(new_setting)
                db.commit()

            response.append({
                "account_id": acc.id,
                "account_name": acc.name,
                "partner_id": p["id"],
                "partner_name": p["name"],
                "is_shared": is_shared
            })

    return response

@router.put("/sharing-settings/{account_id}", response_model=schemas.SharingSettingsResponse)
def update_sharing_setting(
    account_id: int,
    toggle: schemas.SharingSettingToggle,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account ownership
    acc = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.user_id == current_user.id
    ).first()

    if not acc:
        raise HTTPException(status_code=404, detail="Account not found.")

    # Verify active partnership
    verify_partnership(db, current_user.id, toggle.partner_id)

    # Query setting
    setting = db.query(models.AccountSharingSettings).filter(
        models.AccountSharingSettings.user_id == current_user.id,
        models.AccountSharingSettings.account_id == account_id,
        models.AccountSharingSettings.partner_id == toggle.partner_id
    ).first()

    if setting:
        setting.is_shared = toggle.is_shared
    else:
        setting = models.AccountSharingSettings(
            user_id=current_user.id,
            account_id=account_id,
            partner_id=toggle.partner_id,
            is_shared=toggle.is_shared
        )
    
    db.add(setting)
    db.commit()
    db.refresh(setting)

    partner_user = db.query(models.User).filter(models.User.id == toggle.partner_id).first()

    return {
        "account_id": setting.account_id,
        "account_name": acc.name,
        "partner_id": setting.partner_id,
        "partner_name": partner_user.name if partner_user else "",
        "is_shared": setting.is_shared
    }
