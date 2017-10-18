select *
from person
where lower(username) = lower(${username})