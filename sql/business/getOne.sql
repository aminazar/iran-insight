select
    business.*,
    person.display_name_en,
    person.display_name_fa,
    person.firstname_en,
    person.firstname_fa,
    person.surname_en,
    person.surname_fa
from
    business
left outer join
    person
on
    person.pid = business.ceo_pid
where
    bid = ${bid}