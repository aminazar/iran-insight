select assoc.pid, assoc.bid from association assoc
inner join membership mem on assoc.aid = mem.assoc_id
where assoc.oid is null and mem.is_active = false and mem.is_representative is true;