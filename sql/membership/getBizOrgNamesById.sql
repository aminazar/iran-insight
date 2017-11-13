select
    business.name,
    business.name_fa,
    true as is_biz
from membership
join association on membership.assoc_id = association.aid
join business on association.bid = business.bid
where membership = ${mid}

union

select
    organization.name,
    organization.name_fa,
    false as is_biz
from membership
join association on membership.assoc_id = association.aid
join organization on association.oid = organization.oid
where membeship = ${mid}