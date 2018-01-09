select
    ${tableName~}.*,
    association.*,
    business.name as biz_name,
    business.name_fa as biz_name_fa,
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
    and association.oid = ${oid}
join
    business
on
    business.bid = association.bid
join
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
