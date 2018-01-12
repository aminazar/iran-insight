select *
from
(select
    count(*) over () as total,
    product.*
from product
where
    (${show_all} = true)
    or(
        (${phrase} is not null and (
               lower(name) like '%'||lower(${phrase})||'%'
            or lower(name_fa) like '%'||lower(${phrase})||'%'
            or lower(description) like '%'||lower(${phrase})||'%'
            or lower(description_fa) like '%'||lower(${phrase})||'%'
        ) or ${phrase} is null)
    )) as t
order by t.product_id DESC limit ${limit} offset ${offset}