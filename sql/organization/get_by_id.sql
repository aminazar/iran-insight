SELECT
    o.oid,
    o.name as org_name,
    o.name_fa as org_name_fa,
    o.start_date as org_start_date,
    o.end_date as org_end_date,
    ot.id as org_type_id,
    ot.name as org_type,
    ot.name_fa as org_type_fa,
    person.pid as ceo_id,
    person.display_name_en as ceo_name,
    person.display_name_fa as ceo_name_fa
FROM organization as o
LEFT outer JOIN organization_type as ot ON o.org_type_id = ot.id
left outer join person on o.ceo_pid = person.pid
where o.oid = ${oid}