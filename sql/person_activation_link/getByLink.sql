select
    person_activation_link.link,
    person_activation_link.pid,
    person.username
from person_activation_link
join person on person_activation_link.pid = person.pid
where link = ${link}