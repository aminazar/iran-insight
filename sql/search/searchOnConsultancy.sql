select
    consultancy.*,
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
from consultancy
join association on consultancy.assoc_id = association.aid
left outer join business on association.bid = business.bid
left outer join organization on association.oid = organization.oid
left outer join person on association.pid = person.pid
where
    (${show_all} = true)
    or(
           lower(consultancy.subject) like '%'||lower(${phrase})||'%'
        or lower(consultancy.subject_fa) like '%'||lower(${phrase})||'%'
        and ((${is_mentor} is not null and consultancy.is_mentor = ${is_mentor}) or (${is_mentor} is null))
    )
    and consultancy.is_confirmed = true
order by consultancy.id DESC limit ${limit} offset ${offset}