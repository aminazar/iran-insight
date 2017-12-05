select
    person_expertise.peid,
    person_expertise.expertise_id,
    expertise.name_en,
    expertise.name_fa,
    expertise.is_education
from person
inner join person_expertise on person.pid = person_expertise.pid
inner join expertise on expertise.expertise_id = person_expertise.expertise_id
where person.pid = ${pid}