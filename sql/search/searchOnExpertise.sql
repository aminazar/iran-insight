select *
from expertise
where
    (${show_all} = true)
    or (
           lower(name_en) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    or ((${is_education} = true or ${is_education} = false) and is_education = ${is_education})
order by expertise_id limit ${limit} offset ${offset}