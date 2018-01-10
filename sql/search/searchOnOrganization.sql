select *
from
(select
    count(*) over () as total,
    organization.*,
    organization_type.name as organization_type_name,
    organization_type.name_fa as organization_type_name_fa
from organization
left outer join organization_type on organization_type.id = organization.org_type_id
where
    (${show_all} = true)
    or(
        (${phrase} is not null and (
               lower(organization.name) like '%'||lower(${phrase})||'%'
            or lower(organization.name_fa) like '%'||lower(${phrase})||'%'
            or lower(organization_type.name) like '%'||lower(${phrase})||'%'
            or lower(organization_type.name_fa) like '%'||lower(${phrase})||'%'
            and (${tag_search} is null or (${tag_search} is not null and oid in (
                select organization.oid
                from unnest(organization.tags) a
                join tag on a = tag.name
                where tag.active = true and lower(a) like '%'||lower(${phrase})||'%'
            )))
        ) or ${phrase} is null)
    )) as t
order by t.oid DESC limit ${limit} offset ${offset}