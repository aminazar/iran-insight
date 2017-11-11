select *
from business_lce
join business on business_lce.bid2 = business.bid
where business_lce.id = ${id}