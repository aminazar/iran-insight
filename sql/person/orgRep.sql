select
    association.aid,
    membership.mid
from
    person
join
    association
on
    association.pid = person.pid
join
    membership
on
    membership.assoc_id = association.aid
    and membership.is_active = true
    and membership.is_representative = true
join
    organization
on
    association.oid = organization.oid
    and organization.oid = ${oid}
where
    person.pid = ${pid}