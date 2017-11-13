select
    business.name,
    business.name_fa,
    association.pid,
    true as is_biz
from membership
join association on membership.assoc_id = association.aid
join business on association.bid = business.bid
where membership = ${mid}

union

select
    organization.name,
    organization.name_fa,
    association.pid,
    false as is_biz
from membership
join association on membership.assoc_id = association.aid
join organization on association.oid = organization.oid
where membeship = ${mid}