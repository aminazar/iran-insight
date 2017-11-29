select * from
((select
    'business' as table_name,
    id,
    name,
    name_fa
from business_type
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    and active = true)
union
(select
    'organization' as table_name,
    id,
    name,
    name_fa
from organization_type
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    and active = true)
union
(select
    'lce' as table_name,
    id,
    name,
    name_fa
from lce_type
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    and active = true)
union
(select
    'attendance' as table_name,
    id,
    name,
    name_fa
from attendance_type
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    and active = true)
union
(select
    'position' as table_name,
    id,
    name,
    name_fa
from position_type
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    and active = true)) as t
order by id limit ${limit} offset ${offset}