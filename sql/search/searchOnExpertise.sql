select *
from expertise
where
    (${show_all} = true)
    or (
           lower(name_en) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    and ((${is_education} is not null and is_education = ${is_education}) or (${is_education} is null))
order by expertise_id DESC limit ${limit} offset ${offset}