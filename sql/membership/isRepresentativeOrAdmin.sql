select person.*
from membership
join association on membership.assoc_id = association.aid
join person on association.pid = person.pid
where membership.is_representative = true and
      membership.is_active = true and
      person.pid = ${pid}
union
select *
from person
where lower(person.username) = 'admin' and person.pid = ${pid}