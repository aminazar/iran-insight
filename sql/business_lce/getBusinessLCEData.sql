select
    business_lce.*,
    former.bid as former_bid,
    former.name as former_name,
    former.name_fa as former_name_fa,
    seconder.bid as seconder_bid,
    seconder.name as seconder_name,
    seconder.name_fa as seconder_name_fa
from business_lce
join business as former on business_lce.bid1 = former.bid
left outer join business as seconder on business_lce.bid2 = seconder.bid
where business_lce.id = ${id}