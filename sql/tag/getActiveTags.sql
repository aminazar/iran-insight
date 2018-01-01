create or replace function getTags() returns text[] as $$
declare
tag_name text;
res text[];

begin
FOREACH tag_name IN ARRAY (select tags from ${tableName~} where ${condition^}) LOOP
	if ((select count(*) from tag where name = tag_name and active = true) > 0) then
    	res = array_append(res,tag_name);
    END IF;
END LOOP;
return res;

end;
$$ LANGUAGE plpgsql;
select * from getTags();


