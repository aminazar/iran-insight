select * from organization_lce
where
oid1 = (select  * from organization where organization.name like '%'${name}'%' or organization.name_fa like '%'${name_fa}'%'  )
