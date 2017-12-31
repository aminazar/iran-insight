create or replace function getTags() returns text[] as $$
declare
tag_name text;
res text[];
props json;

begin
FOREACH tag_name IN ARRAY (select tags from ${tableName~} where ${condition^}) LOOP
	select proposer into props from tag where name = tag_name;
    if (json_array_length(props->'business') = 0 and  json_array_length(props->'organization') = 0 and  json_array_length(props->'product') = 0 ) then
    	res = array_append(res,tag_name);
    END IF;
END LOOP;
return res;

end;
$$ LANGUAGE plpgsql;
select * from getTags();


