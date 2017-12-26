select *
from
(select
    count(*) over () as total,
    expertise.*
from expertise
where
    (${show_all} = true)
    or (
        (${phrase} is not null and (
            lower(name_en) like '%'||lower(${phrase})||'%'
            or lower(name_fa) like '%'||lower(${phrase})||'%'
        ) or ${phrase} is null)
        and ((${is_education} is not null and is_education = ${is_education}) or (${is_education} is null)
    )
    )) as t
order by t.expertise_id DESC limit ${limit} offset ${offset}