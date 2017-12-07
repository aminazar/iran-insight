select *
from person
where pid = ${pid} and ((${is_user} is not null and is_user = ${is_user}) or (${is_user} is null));
