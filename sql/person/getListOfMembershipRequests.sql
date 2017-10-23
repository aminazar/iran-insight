select assoc.pid, assoc.oid from association assoc
inner join membership mem on assoc.aid = mem.assoc_id
where assoc.bid is null and mem.is_active = false and mem.is_representative is false;