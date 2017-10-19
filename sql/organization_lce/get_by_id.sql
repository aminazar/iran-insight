SELECT
 organization.name,
 organization_lce.oid1,
 organization_lce.oid2,
 organization_lce.start_date,
 organization_lce.start_date_fa,
 organization_lce.end_date,
 organization_lce.end_date_fa,
 organization_lce.description,
 organization_lce.description_fa,
 organization_lce.lce_type_id
FROM
 organization
INNER JOIN
 organization_lce
 ON
 organization.oid = organization_lce.oid1
where organization_lce.oid1 = ${oid};
