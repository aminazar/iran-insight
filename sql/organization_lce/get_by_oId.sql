select 
	lce.*,
    lt.name as lce_name,
    lt.name_fa as lce_name_fa,
    lt.is_killer
from (
        select 
            temp.name as org1_name,
            temp.name_fa as org2_bane_fa,
            o.name as org2_name,
            o.name_fa as org2_name_fa,
            temp.description,
            temp.description_fa,
            temp.start_date,
            temp.end_date,
            temp.lce_type_id

        from (
                select * from 
                organization_lce as ol
                inner join organization as o
                on ol.oid1 = o.oid
                where o.oid = ${oid}
             ) as temp
        left outer join  organization as o
        on temp.oid2 = o.oid
) as lce
left outer join lce_type as lt
on lt.lce_type_id = lce.lce_type_id;

    