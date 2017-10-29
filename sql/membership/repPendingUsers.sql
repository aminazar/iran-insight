select
    association.oid,
    association.bid,

    biz_pending_member.*,
    business.name as biz_name_en,
    business.name_fa as biz_name_fa,

    org_pending_member.*,
    organization.name as org_name_en,
    organization.name_fa as org_name_fa
from
    membership
join
    association
on
    association.aid = membership.assoc_id
    and association.pid = ${pid}
left outer join
    (select
        association.aid as biz_a_aid,
        association.bid as biz_a_bid,
        person.firstname_en as biz_a_firstname_en,
        person.surname_en as biz_a_surname_en,
        person.firstname_fa as biz_a_firstname_fa,
        person.surname_fa as biz_a_surname_fa,
        position_type.name as biz_a_position_name,
        position_type.name_fa as biz_a_position_name_fa,
        membership.is_active as biz_a_membership_is_active,
        membership.mid as biz_a_mid
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
    left outer join
        position_type
    on
        position_type.id = membership.position_id
    where
        membership.end_time is null) biz_pending_member
on
    biz_pending_member.biz_a_bid = association.bid
left outer join
    business
on
    association.bid = business.bid
left outer join
    (select
        association.aid as org_a_aid,
        association.oid as org_a_oid,
        person.firstname_en as org_a_firstname_en,
        person.surname_en as org_a_surname_en,
        person.firstname_fa as org_a_firstname_fa,
        person.surname_fa as org_a_surname_fa,
        position_type.name as org_a_position_name,
        position_type.name_fa as org_a_position_name_fa,
        membership.is_active as org_a_membership_is_active,
        membership.mid as org_a_mid
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
    left outer join
        position_type
    on
        position_type.id = membership.position_id
    where
        membership.end_time is null) org_pending_member
on
    org_pending_member.org_a_oid = association.oid
left outer join
    organization
on
    association.oid = organization.oid
where
    membership.is_representative = true
    and membership.is_active = true
    and membership.start_time < current_timestamp
    and (membership.end_time is null or membership.end_time > current_timestamp)