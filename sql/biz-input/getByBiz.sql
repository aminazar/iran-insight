select
    ${tableName~}.*,
    association.*,
    organization.name as org_name,
    organization.name_fa as org_name_fa,
    person.firstname_en as person_firstname,
    person.surname_en as person_surname,
    person.firstname_fa as person_firstname_fa,
    person.surname_fa as person_surname_fa,
    claim_person.firstname_en as claimed_by_firstname,
    claim_person.surname_en as claimed_by_surname,
    claim_person.firstname_fa as claimed_by_firstname_fa,
    claim_person.surname_fa as claimed_by_surname_fa,
    claim_person.display_name_en as claimed_by_display_name,
    claim_person.display_name_fa as claimed_by_display_name_fa,
    confirm_person.firstname_fa as confirmed_by_firstname_fa,
    confirm_person.surname_fa as confirmed_by_surname_fa,
    confirm_person.display_name_en as confirmed_by_display_name,
    confirm_person.display_name_fa as confirmed_by_display_name_fa
from
    ${tableName~}
join
    association
on
    ${tableName~}.assoc_id = association.aid
    and association.bid = ${bid}
left outer join
    person
on
    person.pid = association.pid
left outer join
    organization
on
    organization.oid = association.oid
left outer join
    person claim_person
on
    claimed_by = claim_person.pid
left outer join
    person confirm_person
on
    confirmed_by = confirm_person.pid
where
    is_confirmed = ${is_confirmed} or ${is_confirmed} is null;