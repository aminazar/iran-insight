select *
from
(select
    count(*) over () as total,
    investment.*,
    person.pid as person_id,
    person.firstname_en as person_firstname_en,
    person.firstname_fa as person_firstname_fa,
    person.surname_en as person_surname_en,
    person.surname_fa as person_surname_fa,
    person.username as person_username,
    business.bid as business_id,
    business.name as business_name,
    business.name_fa as business_name_fa,
    organization.oid as organization_id,
    organization.name as organization_name,
    organization.name_fa as organization_name_fa
from investment
join association on investment.assoc_id = association.aid
left outer join business on association.bid = business.bid
left outer join organization on association.oid = organization.oid
left outer join person on association.pid = person.pid
where
    (${show_all} = true)
    or(
            lower(investment.currency) like '%'||lower(${phrase})||'%'
        or ((${amount_lt} = true and investment.amount::numeric < ${amount})
            or
            (${amount_gt} = true and investment.amount::numeric > ${amount})
            or
            (${amount_eq} = true and investment.amount::numeric = ${amount})
            )
        and ((${is_lead} is not null and investment.is_lead = ${is_lead}) or (${is_lead} is null))
    )
    and investment.is_confirmed = true) as t
order by t.id DESC limit ${limit} offset ${offset}