select *
from
(select
    count(*) over () as total,
    event.*,
    person.pid as person_id,
    person.firstname_en as person_firstname_en,
    person.firstname_fa as person_firstname_fa,
    person.surname_en as person_surname_en,
    person.surname_fa as person_surname_fa,
    person.display_name_en as person_display_name_en,
    person.display_name_fa as person_display_name_fa,
    person.username as person_username,
    business.bid as business_id,
    business.name as business_name,
    business.name_fa as business_name_fa,
    organization.oid as organization_id,
    organization.name as organization_name,
    organization.name_fa as organization_name_fa
from event
left outer join person on event.organizer_pid = person.pid
left outer join business on event.organizer_bid = business.bid
left outer join organization on event.organizer_oid = organization.oid
where
    (${show_all} = true)
    or(
        (  lower(event.title) like '%'||lower(${phrase})||'%'
        or lower(event.title_fa) like '%'||lower(${phrase})||'%'
        or lower(event.address) like '%'||lower(${phrase})||'%'
        or lower(event.address_fa) like '%'||lower(${phrase})||'%'
        or lower(event.description) like '%'||lower(${phrase})||'%'
        or lower(event.description_fa) like '%'||lower(${phrase})||'%'
        or ${phrase} is null)
        and (
           (${start_date} is not null and ${end_date} is not null and event.start_date >= ${start_date} and event.end_date <= ${end_date})
           or
           (${start_date} is not null and ${end_date} is null and event.start_date >= ${start_date})
           or
           (${start_date} is null and ${end_date} is not null and event.end_date <= ${end_date})
           or
           (${start_date} is null and ${end_date} is null)
           )
        and (
            ${related_to_id} is null or (${related_to_id} is not null and (
                    (lower(${related_to_name}) = 'person' and person.pid = ${related_to_id})
                or  (lower(${related_to_name}) = 'organizatoin' and organization.oid = ${related_to_id})
                or  (lower(${related_to_name}) = 'business' and business.bid = ${related_to_id})
            ))
        )
    )) as t
order by t.eid DESC limit ${limit} offset ${offset}