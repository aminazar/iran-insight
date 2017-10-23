select *
from membership
join association on membership.assoc_id = association.aid
join person on association.pid = person.pid
where membership.is_representative = true and lower(person.username) = lower(${username})