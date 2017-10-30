select *
from person
join administrators on person.pid = administrators.pid
where person.pid = ${pid}