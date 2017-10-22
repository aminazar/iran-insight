SELECT

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
        where organization_lce.id = ${id};
) AS temp
ON organization.oid = temp.oid2
