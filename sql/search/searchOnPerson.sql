select
    person.pid,
    person.firstname_en,
    person.firstname_fa,
    person.surname_en,
    person.surname_fa,
    person.username,
    person.image,
    person.address_en,
    person.address_fa,
    person.phone_no,
    person.mobile_no,
    person.birth_date,
    person.notify_period,
    person.is_user,
    person.display_name_en,
    person.display_name_fa
from person
where
    (${show_all} = true)
    or(
           lower(firstname_en) like '%'||lower(${phrase})||'%'
        or lower(firstname_fa) like '%'||lower(${phrase})||'%'
        or lower(surname_en) like '%'||lower(${phrase})||'%'
        or lower(surname_fa) like '%'||lower(${phrase})||'%'
        or lower(username) like '%'||lower(${phrase})||'%'
        or lower(address_en) like '%'||lower(${phrase})||'%'
        or lower(address_fa) like '%'||lower(${phrase})||'%'
        or lower(display_name_en) like '%'||lower(${phrase})||'%'
        or lower(display_name_fa) like '%'||lower(${phrase})||'%'
    )
order by pid DESC limit ${limit} offset ${offset}