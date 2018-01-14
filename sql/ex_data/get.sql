select *
from
(select
    count(*) over () as total,
    ex_data.*
from ex_data
where
    (${phrase} is null or (
        ${phrase} is not null
        and (
            lower(name) like '%'||lower(${phrase})||'%'
         or lower(type) like '%'||lower(${phrase})||'%'
         or lower(class) like '%'||lower(${phrase})||'%'
         or lower(category) like '%'||lower(${phrase})||'%'
         or lower(province) like '%'||lower(${phrase})||'%'
        )))
     and (${category} is null or (${category} is not null and lower(${category}) = lower(category))))as t
order by eid limit ${limit} offset ${offset}