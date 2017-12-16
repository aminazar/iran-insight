select
    event.*,
    person.display_name_en as organizer_name,
    person.display_name_fa as organizer_name_fa
from event
join person on event.organizer_pid = person.pid
where event.eid = ${eid}

union

select
    event.*,
    business.name as organizer_name,
    business.name_fa as organizer_name_fa
from event
join business on event.organizer_bid = business.bid
where event.eid = ${eid}

union

select
    event.*,
    organization.name as organizer_name,
    organization.name_fa as organizer_name_fa
from event
join organization on event.organizer_oid = organization.oid
where event.eid = ${eid}