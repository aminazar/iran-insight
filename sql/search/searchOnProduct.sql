select *
from product
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
        or lower(description) like '%'||lower(${phrase})||'%'
        or lower(description_fa) like '%'||lower(${phrase})||'%'
    )
order by product_id limit ${limit} offset ${offset}