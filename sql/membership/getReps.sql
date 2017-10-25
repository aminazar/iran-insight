select
    oid, bid
from
    membership
join
    association
on
    associaion.aid = membership.assoc_id
    and membership.is_representative = true
    and membership.is_active = true
where
    association.pid = ${pid}