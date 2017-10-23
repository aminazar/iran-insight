select
    *
from
    person
where
    pid = ${pid}
    and lower(username) = 'admin';