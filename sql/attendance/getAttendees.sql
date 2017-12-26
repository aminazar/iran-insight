(select
    person.display_name_en as name,
    person.display_name_fa as name_fa,
    person.pid as attendee_id,
    attendance.id as attendance_id,
    attendance.attendance_type_id as attendance_type_id,
    attendance_type.name as attendance_type_name,
    attendance_type.name_fa as attendance_type_name_fa,
    'person' as attendee_type
from attendance
join person on attendance.pid = person.pid
left outer join attendance_type on attendance.attendance_type_id = attendance_type.id
where attendance.eid = ${eid})

union

(select
    business.name as name,
    business.name_fa as name_fa,
    business.bid as attendee_id,
    attendance.id as attendance_id,
    attendance.attendance_type_id as attendance_type_id,
    attendance_type.name as attendance_type_name,
    attendance_type.name_fa as attendance_type_name_fa,
    'business' as attendee_type
from attendance
join business on attendance.bid = business.bid
left outer join attendance_type on attendance.attendance_type_id = attendance_type.id
where attendance.eid = ${eid})

union

(select
    organization.name as name,
    organization.name_fa as name_fa,
    organization.oid as attendee_id,
    attendance.id as attendance_id,
    attendance.attendance_type_id as attendance_type_id,
    attendance_type.name as attendance_type_name,
    attendance_type.name_fa as attendance_type_name_fa,
    'organization' as attendee_type
from attendance
join organization on attendance.oid = organization.oid
left outer join attendance_type on attendance.attendance_type_id = attendance_type.id
where attendance.eid = ${eid})