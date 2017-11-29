select
    organization.*,
    organization_type.name as organization_type_name,
    organization_type.name_fa as organization_type_name_fa
from organization
left outer join organization_type on organization_type.id = organization.org_type_id
where
    (${show_all} = true)
    or(
           lower(organization.name) like '%'||lower(${phrase})||'%'
        or lower(organization.name_fa) like '%'||lower(${phrase})||'%'
        or lower(organization_type.name) like '%'||lower(${phrase})||'%'
        or lower(organization_type.name_fa) like '%'||lower(${phrase})||'%'
    )
order by oid DESC limit ${limit} offset ${offset}