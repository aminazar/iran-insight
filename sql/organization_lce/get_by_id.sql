SELECT

-- temp.name as name1,
-- organization.name2,
-- temp.start_date,
-- temp.start_date_fa,
-- temp.end_date,
-- temp.end_date_fa,
-- temp.description,
-- temp.description_fa,
-- temp.lce_type_id
    *
 FROM organization
    LEFT OUTER JOIN (
        SELECT
            *
        FROM
         organization
        INNER JOIN
         organization_lce
         ON
         organization.oid = organization_lce.oid1
        where organ ization_lce.id = ${id};
) AS temp
ON organization.oid = temp.oid2
