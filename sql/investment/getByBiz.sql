select
    investment.*,
    association.*,
    organization.name as org_name,
    organization.name_fa as org_name_fa,
    person.firstname_en as person_firstname,
    person.surname_en as person_surname,
    person.firstname_fa as person_firstname_fa,
    person.surname_fa as person_surname_fa
from
    investment
join
    association
on
    investment.assoc_id = association.aid
    and association.bid = ${bid}
left outer join
    person
on
    person.pid = association.pid
left outer join
    organization
on
    organization.oid = association.oid
