select *
from ex_data
where
    ${phrase} is null or (
        ${phrase} is not null
        and (
            lower(${phrase}) like '%'||lower(name)||'%'
         or lower(${phrase}) like '%'||lower(type)||'%'
         or lower(${phrase}) like '%'||lower(class)||'%'
         or lower(${phrase}) like '%'||lower(category)||'%'
         or lower(${phrase}) like '%'||lower(province)||'%'
        ))
order by eid limit ${limit} offset ${offset}