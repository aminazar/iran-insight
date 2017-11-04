select
    investment.*,
    association.*,
    business.name as biz_name,
    business.name_fa as biz_name_fa,
    organization.name as org_name,
    organization.name_fa as org_name_fa,
    claim_person.firstname_en as claimed_by_firstname,
    claim_person.surname_en as claimed_by_surname,
    claim_person.firstname_fa as claimed_by_firstname_fa,
    claim_person.surname_fa as claimed_by_surname_fa,
    confirm_person.firstname_fa as confirmed_by_firstname_fa,
    confirm_person.surname_fa as confirmed_by_surname_fa
from
    association
join
    investment
on
    investment.assoc_id = association.aid
    and is_confirmed = false
join
    business
on
    business.bid = association.bid
join
    organization
on
    organization.oid = association.oid
left outer join
    person claim_person
on
    claimed_by = claim_person.pid
left outer join
    person confirm_person
on
    confirmed_by = confirm_person.pid
where
    association.oid in (
        select
            oid
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
            and oid is not null
    )
