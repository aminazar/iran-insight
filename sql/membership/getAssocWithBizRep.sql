select
    association.aid,
    membership.mid
from association
join membership on association.aid = membership.assoc_id
where association.pid = ${pid} and association.bid = ${bid} and membership.is_active = true and membership.is_representative = true