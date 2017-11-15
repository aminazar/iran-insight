select expertise.*
from person
inner join person_expertise on person.pid = person_expertise.pid
inner join expertise on expertise.expertise_id = person_expertise.expertise_id
where person.pid = ${pid}