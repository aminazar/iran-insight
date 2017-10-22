-- Using 'assoc' table, we need to figure out if a user is representative of an organization
-- It is not doing so at the moment because assoc is not defined yet
select
    *
from
    person, organization
where
    person.pid = ${pid}
    and organiztion.oid = ${oid}
    and 1=0 -- for now we want to return empty dataset, but if there is real representative, then one row should be returned
