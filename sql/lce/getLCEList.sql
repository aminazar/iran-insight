
select
	lce.*,
    lt.name as lce_name,
    lt.name_fa as lce_name_fa,
    lt.is_killer
from (
        select
            temp.id,
            temp.name as joiner1_name,
            temp.name_fa as joiner1_name_fa,
            joiner.name as joiner2_name,
            joiner.name_fa as joiner2_name_fa,
            temp.start_date,
            temp.end_date,
            temp.lce_type_id,
            temp.is_confirmed

        from (
                select * from
                ${tableName~} as lce -- tableName: lce or organization_lce
                inner join ${joinerName~} as joiner -- JoinerName: business or organization
                on lce.id1 = joiner.${joinerIdName~} or lce.id2 = joiner.${joinerIdName~}  -- joinerIdName: bid or oid
                where joiner.${joinerIdName~} = ${joinerId} and ${condition^} -- weather show all or confirmed or requested lce
             ) as temp
        left outer join  ${joinerName~} as joiner
        on temp.id2 = joiner.${joinerIdName~}
) as lce
left outer join lce_type as lt
on lt.id = lce.lce_type_id;

