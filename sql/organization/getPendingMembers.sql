select
    person.firstname,
    person.surname,
    position_type.name as position_name,
    position_type.name_fa as position_name_fa,
    organization.name as organization_name,
    organization.name_fa as organization_name_fa,
    membership.is_active as membership_is_active
from
    membership
join
    association
on
    associaion.aid = membership.assoc_id
    and membership.is_representative = false
    and association.oid = ${oid}
join
    person
on
    person.pid = association.pid
join
    organization
on
    organization.oid = association.oid
outer join
    position_type
on
    position_type.id = membership.position_id
where
    membership.end_time is null