select
    association.oid,
    association.bid,
    biz_pending_member.*,
    org_pending_member.*
from
    membership
join
    association
on
    association.aid = membership.assoc_id
    and association.pid = 1
left outer join
    (select
        association.bid,
        person.firstname_en as biz_firstname_en,
        person.surname_en as biz_surname_en,
        person.firstname_fa as biz_firstname_fa,
        person.surname_fa as biz_surname_fa,
        position_type.name as biz_position_name,
        position_type.name_fa as biz_position_name_fa,
        business.name as biz_name,
        business.name_fa as biz_name_fa,
        membership.is_active as biz_membership_is_active
    from
        membership
    join
        association
    on
        association.aid = membership.assoc_id
        and membership.is_representative = false
    join
        person
    on
        person.pid = association.pid
    join
        business
    on
        business.bid = association.bid
    left outer join
        position_type
    on
        position_type.id = membership.position_id
    where
        membership.end_time is null) biz_pending_member
on
    biz_pending_member.bid = association.bid
left outer join
    (select
        association.oid,
        person.firstname_en as org_firstname_en,
        person.surname_en as org_surname_en,
        person.firstname_fa as org_firstname_fa,
        person.surname_fa as org_surname_fa,
        position_type.name as org_position_name,
        position_type.name_fa as org_position_name_fa,
        organization.name as org_name,
        organization.name_fa as org_name_fa,
        membership.is_active as org_membership_is_active
    from
        membership
    join
        association
    on
        association.aid = membership.assoc_id
        and membership.is_representative = false
    join
        person
    on
        person.pid = association.pid
    join
        organization
    on
        organization.oid = association.oid
    left outer join
        position_type
    on
        position_type.id = membership.position_id
    where
        membership.end_time is null) org_pending_member
on
    org_pending_member.oid = association.oid
where
    membership.is_representative = true
    and membership.is_active = true