select
    count(*) over () as total,
    t.*
from
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
    and ((${is_active} is not null and active = ${is_active}) or (${is_active} is null)))
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
    and ((${is_active} is not null and active = ${is_active}) or (${is_active} is null)))
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
    and ((${is_active} is not null and active = ${is_active}) or (${is_active} is null)))
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
    and ((${is_active} is not null and active = ${is_active}) or (${is_active} is null)))
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
    and ((${is_active} is not null and active = ${is_active}) or (${is_active} is null)))) as t
order by id DESC limit ${limit} offset ${offset}