update person
set secret = ${secret}
where pid in (
select p.pid
from person as p
join person_activation_link on p.pid = person_activation_link.pid
where person_activation_link.link = ${link} and lower(p.username) = lower(${username})
) returning person.pid