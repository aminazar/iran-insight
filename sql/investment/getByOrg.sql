select
    investment.*,
    association.*,
    business.name as biz_name,
    business.name_fa as biz_name_fa
from
    investment
join
    association
on
    investment.assoc_id = association.aid
    and association.oid = ${oid}
join
    business
on
    business.bid = association.bid
join
    organization
on
    organization.oid = association.oid