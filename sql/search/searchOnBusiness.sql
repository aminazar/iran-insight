select
    business.*,
    business_type.name as business_type_name,
    business_type.name_fa as business_type_name_fa
from business
left outer join business_type on business_type.id = business.biz_type_id
where
    (${show_all} = true)
    or(
           lower(business.name) like '%'||lower(${phrase})||'%'
        or lower(business.name_fa) like '%'||lower(${phrase})||'%'
        or lower(business.address) like '%'||lower(${phrase})||'%'
        or lower(business.address_fa) like '%'||lower(${phrase})||'%'
        or lower(business.tel) like '%'||lower(${phrase})||'%'
        or lower(business.url) like '%'||lower(${phrase})||'%'
        or lower(business_type.name) like '%'||lower(${phrase})||'%'
        or lower(business_type.name_fa) like '%'||lower(${phrase})||'%'
    )
order by business.bid limit ${limit} offset ${offset}