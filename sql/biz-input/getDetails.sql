select
    ${tableName~}.*,
    business.name as business_name,
    business.name_fa as business_name_fa
from ${tableName~} as tbl
join association on tbl.assoc_id = association.aid
join business on association.bid = business.bid
where id = ${id}