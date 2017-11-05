select person.*, false as is_admin
from membership
join association on membership.assoc_id = association.aid
join person on association.pid = person.pid
where membership.is_representative = true and
      membership.is_active = true and
      person.pid = ${pid} and
      person.pid not in (select pid from administrators) and
      ((association.bid = ${bid} and bid is not null) or (association.oid = ${oid} and oid is not null))
union
select *, true as is_admin
from person
where person.pid = ${pid} and pid in (select pid from administrators)