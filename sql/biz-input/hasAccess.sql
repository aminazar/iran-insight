select ${tableName~}.*
from ${tableName~}
join association on ${tableName~}.assoc_id = association.aid
where ${tableName~}.id = ${id} and association.pid = ${user_id}

union

select ${tableName~}.*
from ${tableName~}
join association on ${tableName~}.assoc_id = association.aid
join association as rep_assoc on rep_assoc.oid = association.oid
join person on person.pid = rep_assoc.pid
join membership on rep_assoc.aid = membership.assoc_id
where ${tableName~}.id = ${id} and person.pid = ${user_id} and membership.is_active = true and membership.is_representative = true