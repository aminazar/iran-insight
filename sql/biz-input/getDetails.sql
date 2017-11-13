select
    ${tableName~}.*,
    association.pid as person_id,
    association.oid as organization_id,
    association.bid as business_id,
    business.name as business_name,
    business.name_fa as business_name_fa
from ${tableName~} as tbl
join association on tbl.assoc_id = association.aid
join business on association.bid = business.bid
where id = ${id}