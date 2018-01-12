SELECT
o.oid,
o.name as org_name,
o.name_fa as org_name_fa,
o.start_date as org_start_date,
o.end_date as org_end_date,
ot.name as org_type,
ot.name_fa as org_type_fa

FROM organization as o
LEFT JOIN organization_type as ot
ON o.org_type_id = ot.id
where o.oid = ${oid};