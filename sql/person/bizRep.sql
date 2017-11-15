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
    business
on
    association.bid = business.bid
    and business.bid = ${bid}
where
    person.pid = ${pid}