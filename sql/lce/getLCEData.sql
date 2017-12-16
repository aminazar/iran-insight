select
    ${tableName~}.*, -- tableName: business_lce or organization_lce
    former.${joinerIdName~} as former_id, -- joinerIdName: bid or oid
    former.name as former_name,
    former.name_fa as former_name_fa,
    seconder.${joinerIdName~} as seconder_id,
    seconder.name as seconder_name,
    seconder.name_fa as seconder_name_fa
from ${tableName~}
join ${joinerName~} as former on business_lce.id1 = former.${joinerIdName~}
left outer join ${joinerName~} as seconder on ${tableName~}.id2 = seconder.${joinerIdName~} -- JoinerName: business or organization
where ${tableName~}.id = ${id}