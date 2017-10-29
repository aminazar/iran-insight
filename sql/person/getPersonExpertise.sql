select expertise.*
from person
join person_expertise on person.pid = person_expertise.pid
join expertise on expertise.expertise_id = person_expertise.expertise_id
where person.pid = ${pid}