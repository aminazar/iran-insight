select *
from
(select
    count(*) over () as total,
    business.*,
    business_type.name as business_type_name,
    business_type.name_fa as business_type_name_fa
from business
left outer join business_type on business_type.id = business.biz_type_id
where
    (${show_all} = true)
    or(
        (${phrase} is not null and (
               lower(business.name) like '%'||lower(${phrase})||'%'
            or lower(business.name_fa) like '%'||lower(${phrase})||'%'
            or lower(business.address) like '%'||lower(${phrase})||'%'
            or lower(business.address_fa) like '%'||lower(${phrase})||'%'
            or lower(business.tel) like '%'||lower(${phrase})||'%'
            or lower(business.url) like '%'||lower(${phrase})||'%'
            or lower(business_type.name) like '%'||lower(${phrase})||'%'
            or lower(business_type.name_fa) like '%'||lower(${phrase})||'%'
            and (${tag_search} is null or (${tag_search} is not null and bid in (
                select business.bid
                from unnest(business.tags) a
                join tag on a = tag.name
                where tag.active = true and lower(a) like '%'||lower(${phrase})||'%'
            )))
        ) or ${phrase} is null)
    )) as t
order by t.bid DESC limit ${limit} offset ${offset}