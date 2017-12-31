do $$
declare
    tag_id int;
begin

    UPDATE ${tableName~} SET tags = array_remove(tags,${tag}) WHERE ${condition^};
    select tid into tag_id from tag where name like '%${tag^}%';

     UPDATE tag
        SET proposer = jsonb_set(proposer,'{${tableName^}}', (proposer->${tableName}) - ${proposerId}, true) -- table name here represents proposer type
     where tid = tag_id;

end $$;
