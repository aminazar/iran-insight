select person.*
from business
join association on association.bid = business.bid
join membership on association.aid = membership.assoc_id
join person on association.pid = person.pid
where business.bid = ${bid} and is_representative = true