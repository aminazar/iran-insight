select person.*, false as is_admin
from membership
join association on membership.assoc_id = association.aid
join person on association.pid = person.pid
where membership.is_representative = true and
      membership.is_active = true and
      association.pid = ${pid} and
      association.oid = ${oid} and
      person.pid not in (select pid from administrators)
union
select *, true as is_admin
from person
where person.pid = ${pid} and pid in (select pid from administrators)