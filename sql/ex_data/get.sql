select *
from
(select
    count(*) over () as total,
    (case when business.bid is null then false else true end) as pending,
    ex_data.*
from ex_data
left outer join business on ex_data.bid = business.bid
where
    (${phrase} is null or (
        ${phrase} is not null
        and (
            lower(ex_data.name) like '%'||lower(${phrase})||'%'
         or lower(ex_data.type) like '%'||lower(${phrase})||'%'
         or lower(ex_data.class) like '%'||lower(${phrase})||'%'
         or lower(ex_data.category) like '%'||lower(${phrase})||'%'
         or lower(ex_data.province) like '%'||lower(${phrase})||'%'
        )))
     and (${category} is null or (${category} is not null and lower(${category}) = lower(ex_data.category))))as t
order by ${order^} ${direction^} limit ${limit} offset ${offset}