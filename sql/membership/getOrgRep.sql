select person.*
from organization
join association on association.oid = organization.oid
join membership on association.aid = membership.assoc_id
join person on association.pid = person.pid
where organization.oid = ${oid} and membership.is_representative = true and membership.is_active = true and (membership.end_time is null or membership.end_time > current_date)