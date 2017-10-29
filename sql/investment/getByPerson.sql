select
    investment.*,
    association.*,
    business.name as biz_name,
    business.name_fa as biz_name_fa,
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
    and association.pid = ${pid}
join
    business
on
    business.bid = association.bid
join
    person
on
    person.pid = association.pid
