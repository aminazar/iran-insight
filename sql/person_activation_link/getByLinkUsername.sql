select *
from person_activation_link
join person on person_activation_link.pid = perosn.pid
where person_activation_link.link = ${link} and lower(person.username) = ${username}