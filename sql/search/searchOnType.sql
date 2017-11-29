select * from
((select
    'business' as table_name,
    id,
    name,
    name_fa,
    active
from business_type
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    or (${is_active} is not null and active = ${is_active}))
union
(select
    'organization' as table_name,
    id,
    name,
    name_fa,
    active
from organization_type
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    or (${is_active} is not null and active = ${is_active}))
union
(select
    'lce' as table_name,
    id,
    name,
    name_fa,
    active
from lce_type
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    or (${is_active} is not null and active = ${is_active}))
union
(select
    'attendance' as table_name,
    id,
    name,
    name_fa,
    active
from attendance_type
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    or (${is_active} is not null and active = ${is_active}))
union
(select
    'position' as table_name,
    id,
    name,
    name_fa,
    active
from position_type
where
    (${show_all} = true)
    or(
           lower(name) like '%'||lower(${phrase})||'%'
        or lower(name_fa) like '%'||lower(${phrase})||'%'
    )
    or (${is_active} is not null and active = ${is_active}))) as t
order by id limit ${limit} offset ${offset}