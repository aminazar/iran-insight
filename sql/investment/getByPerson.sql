select
    investment.*,
    association.*,
    business.name as biz_name,
    business.name_fa as biz_name_fa,
    claim_person.firstname_en as claimed_by_firstname,
    claim_person.surname_en as claimed_by_surname,
    claim_person.firstname_fa as claimed_by_firstname_fa,
    claim_person.surname_fa as claimed_by_surname_fa,
    confirm_person.firstname_fa as confirmed_by_firstname_fa,
    confirm_person.surname_fa as confirmed_by_surname_fa
from
    investment
join
    association
on
    investment.assoc_id = association.aid
    and association.pid = ${pid}
join
    business
on
    business.bid = association.bid
join
    person
on
    person.pid = association.pid
left outer join
    person claim_person
on
    claimed_by = claim_person.pid
left outer join
    person confirm_person
on
    confirmed_by = confirm_person.pid
where
    is_confirmed = true

