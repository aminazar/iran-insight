select person.*
from membership
join association on membership.assoc_id = association.aid
join person on association.pid = person.pid
where membership.is_active = true and
      lower(person.username) = lower(${username})
union
select *
from person
where lower(person.username) = 'admin' and person.pid = ${pid}