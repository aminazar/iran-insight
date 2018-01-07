select *
from
(select
    count(*) over () as total,
    tag.*
from tag
where
    (${show_all} = true)
    or(
        (${phrase} is not null and lower(name) like '%'||lower(${phrase})||'%')
        or (${phrase} is null)
    )
    and (${is_active} is null or ${is_active} = active)) as t
order by t.tid DESC limit ${limit} offset ${offset}