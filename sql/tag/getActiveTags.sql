create or replace function getTags() returns text[] as $$
declare

tag_name text;
res text[];

begin

if ((select tags from ${tableName~} where ${condition^}) != '{}') then
        FOREACH tag_name IN Array(select tags from ${tableName~} where ${condition^}) LOOP
            if ((select count(*) from tag where name = tag_name and active = true) > 0) then
                res = array_append(res,tag_name);
            END IF;
        END LOOP;
end if;

return res;
end;
$$ LANGUAGE plpgsql;
select * from getTags();


