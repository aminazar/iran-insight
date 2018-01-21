select person.*
from business
join association on association.bid = business.bid
join membership on association.aid = membership.assoc_id
join person on association.pid = person.pid
where business.bid = ${bid} and membership.is_representative = true and membership.is_active = true and (membership.end_time is null or membership.end_time > current_date)