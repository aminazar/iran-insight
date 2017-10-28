select organization.oid
from organization
join association on association.oid = organization.oid
join membership on association.aid = membership.assoc_id
join person on association.pid = person.pid
where organization.oid = ${oid} and is_representative = true