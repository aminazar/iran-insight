(select
    business_lce.bid1 as part1_id,
    business_lce.bid2 as part2_id,
    business_lce.start_date,
    business_lce.end_date,
    business_lce.description,
    business_lce.description_fa,
    business_lce.aid,
    lce_type.name as type_name,
    lce_type.name_fa as type_name_fa,
    biz1.name as part1_name,
    biz1.name_fa as part1_name_fa,
    biz2.name as part2_name,
    biz2.name_fa as part2_name_fa,
    true as is_biz
from business_lce
join business as biz1 on business_lce.bid1 = biz1.bid
join lce_type on business_lce.lce_type_id = lce_type.id
left outer join business as biz2 on business_lce.bid2 = biz2.bid
where
       lower(business_lce.description) like '%'||lower(${phrase})||'%'
    or lower(business_lce.description_fa) like '%'||lower(${phrase})||'%'
    or (
        (${start_date} is not null and ${end_date} is not null and business_lce.start_date >= ${start_date} and business_lce.end_date <= ${end_date})
        or
        (${start_date} is not null and ${end_date} is null and business_lce.start_date >= ${start_date})
        or
        (${start_date} is null and ${end_date} is not null and business_lce.end_date <= ${end_date})
        )
    and business_lce.is_confirmed = true
    and lce_type.active = true
order by business_lce.bid1, business_lce.bid2 limit ${limit} offset ${offset})

union

(select
    organization_lce.oid1 as part1_id,
    organization_lce.oid2 as part2_id,
    organization_lce.start_date,
    organization_lce.end_date,
    organization_lce.description,
    organization_lce.description_fa,
    organization_lce.aid,
    lce_type.name as type_name,
    lce_type.name_fa as type_name_fa,
    org1.name as part1_name,
    org1.name_fa as part1_name_fa,
    org2.name as part2_name,
    org2.name_fa as part2_name_fa,
    false as is_biz
from organization_lce
join organization as org1 on organization_lce.oid1 = org1.oid
join lce_type on organization_lce.lce_type_id = lce_type.id
left outer join organization as org2 on organization_lce.oid2 = org2.oid
where
    (${show_all} = true)
    or(
        lower(organization_lce.description) like '%'||lower(${phrase})||'%'
        or lower(organization_lce.description_fa) like '%'||lower(${phrase})||'%'
        or (
            (${start_date} is not null and ${end_date} is not null and organization_lce.start_date >= ${start_date} and organization_lce.end_date <= ${end_date})
            or
            (${start_date} is not null and ${end_date} is null and organization_lce.start_date >= ${start_date})
            or
            (${start_date} is null and ${end_date} is not null and organization_lce.end_date <= ${end_date})
            )
    )
    and organization_lce.is_confirmed = true
    and lce_type.active = true
order by organization_lce.oid1, organization_lce.oid2 limit ${limit} offset ${offset})