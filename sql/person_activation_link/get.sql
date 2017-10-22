select *
from person_activation_link as pal
join person on person.pid = pal.pid
where lower(username) = lower(${username})