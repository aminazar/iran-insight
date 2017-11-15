select
    ${tableName~}.*,
    association.*,
    business.name as biz_name,
    business.name_fa as biz_name_fa,
    organization.name as org_name,
    organization.name_fa as org_name_fa,
    person.firstname_en as person_firstname,
    person.surname_en as person_surname,
    person.firstname_fa as person_firstname_fa,
    person.surname_fa as person_surname_fa,
    claim_person.firstname_en as claimed_by_firstname,
    claim_person.surname_en as claimed_by_surname,
    claim_person.firstname_fa as claimed_by_firstname_fa,
    claim_person.surname_fa as claimed_by_surname_fa,
    null as confirmed_by_firstname_fa,
    null as confirmed_by_surname_fa
from
    association
join
    ${tableName~}
on
    ${tableName~}.assoc_id = association.aid
    and is_confirmed = false
join
    business
on
    association.bid = business.bid
left outer join
    person
on
    person.pid = association.pid
left outer join
    organization
on
    organization.oid = association.oid
left outer join
    person claim_person
on
    claimed_by = claim_person.pid
where
    association.bid in (
        select
            bid
        from
            association
        join
            membership
        on
            association.aid = membership.assoc_id
            and membership.is_active = true
            and membership.is_representative = true
        where
            association.pid = ${pid}
            and bid is not null
    )
